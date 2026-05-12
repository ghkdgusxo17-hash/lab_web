/**
 * 대학교 시간표 PDF 파싱 라이브러리
 *
 * 학교 시간표 PDF에서 과목 정보를 추출합니다.
 * pymupdf(fitz)의 테이블 추출 기능을 활용하여 정확한 셀 데이터를 파싱합니다.
 */

import { execFile } from 'child_process';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { randomBytes } from 'crypto';

export interface ParsedCourse {
  dayOfWeek: number;    // 0=월, 1=화, 2=수, 3=목, 4=금, 5=토
  startTime: string;    // "09:00"
  endTime: string;      // "10:00"
  courseName: string;   // 과목명
  professor: string | null;  // 교수명
  room: string | null;       // 강의실
}

export interface ParsedTimetable {
  semester: string;     // "2026-1"
  studentId: string;    // 학번
  studentName: string;  // 성명
  courses: ParsedCourse[];
}

// Python 스크립트: pymupdf로 PDF 테이블 추출 → JSON 출력
const PYTHON_SCRIPT = `
# -*- coding: utf-8 -*-
import sys, json, re, os, io, warnings

# Windows cp949 → UTF-8 강제 (한글 깨짐 방지)
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

# pymupdf 경고 메시지 억제 (stdout 오염 방지)
warnings.filterwarnings("ignore")
os.environ["PYMUPDF_MESSAGE"] = "path:NUL" if sys.platform == "win32" else "path:/dev/null"

import fitz

def parse_timetable(pdf_path):
    doc = fitz.open(pdf_path)
    page = doc[0]

    # 테이블 추출 (stdout 경고 억제)
    _orig_stdout = sys.stdout
    sys.stdout = io.StringIO()
    tables = page.find_tables()
    sys.stdout = _orig_stdout
    if not tables:
        return json.dumps({"error": "No tables found"}, ensure_ascii=False)

    data = tables[0].extract()

    # 헤더 파싱
    semester = ""
    student_id = ""
    student_name = ""

    for row in data[:3]:
        for cell in row:
            if cell and "학년도" in cell:
                m = re.search(r"(\\d{4})학년도\\s*(\\d)학기", cell)
                if m:
                    semester = f"{m.group(1)}-{m.group(2)}"
            if cell and "학번" in cell:
                m = re.search(r"학번\\s*:\\s*(\\d+)\\s*성명\\s*:\\s*(\\S+)", cell)
                if m:
                    student_id = m.group(1)
                    student_name = m.group(2)

    # 요일 컬럼 매핑 (헤더 Row 3에서 추출)
    day_cols = {}
    header_row = data[3] if len(data) > 3 else []
    day_map = {"월": 0, "화": 1, "수": 2, "목": 3, "금": 4, "토": 5}
    for col_idx, cell in enumerate(header_row):
        if cell:
            for day_name, day_num in day_map.items():
                if cell.startswith(day_name):
                    day_cols[col_idx] = day_num
                    break

    # 시간 슬롯 매핑 (30분 단위, Row 5~30 = slot 0~25)
    slot_times = {}
    row_to_slot = {}
    for row_idx in range(5, min(len(data), 31)):
        row = data[row_idx]
        if row[2] is not None:
            try:
                slot_num = int(row[2])
                row_to_slot[row_idx] = slot_num
                time_str = row[3] if row[3] else ""
                if "~" in time_str:
                    start_t, end_t = time_str.split("~")
                    slot_times[slot_num] = {"start": start_t.strip(), "end": end_t.strip()}
            except (ValueError, IndexError):
                pass

    # 50분제 교시 매핑: 각 교시는 2 슬롯(1시간)
    # 교시 경계에서 시작하는 과목은 해당 교시만큼 지속
    period_slots = {}  # 교시이름 -> (start_slot, num_slots)
    for row_idx in range(5, min(len(data), 31)):
        row = data[row_idx]
        if row[1] and "교" in str(row[1]):
            slot = row_to_slot.get(row_idx)
            if slot is not None:
                period_slots[row_idx] = slot

    # 과목 추출 (병합 범위 무시, 고정 2슬롯 사용)
    courses = []
    for col_idx, day_num in day_cols.items():
        row_idx = 5
        while row_idx < min(len(data), 31):
            row = data[row_idx]
            if col_idx < len(row) and row[col_idx] and row[col_idx].strip():
                cell_text = row[col_idx].strip()

                # 시작 슬롯
                start_slot = row_to_slot.get(row_idx)
                if start_slot is None:
                    row_idx += 1
                    continue

                # 병합 범위 건너뛰기 (다음 과목을 찾기 위해)
                end_row = row_idx + 1
                while end_row < min(len(data), 31):
                    next_row = data[end_row]
                    if col_idx < len(next_row) and next_row[col_idx] is None:
                        end_row += 1
                    else:
                        break

                # 과목 지속 시간: 병합 셀 범위 사용 (None 행 개수 + 1)
                num_slots = end_row - row_idx

                end_slot = start_slot + num_slots - 1

                start_time = slot_times.get(start_slot, {}).get("start", "")
                end_time = slot_times.get(end_slot, {}).get("end", "")

                # 셀 텍스트 파싱
                lines = [l.strip() for l in cell_text.split("\\n") if l.strip()]
                course_name = ""
                professor = None
                room = None

                room_pattern = re.compile(r'^[A-Z가-힣]\\d{1,2}-\\d{2,4}$|^\\d{1,2}-\\d{3,4}$')
                prof_pattern = re.compile(r'^[가-힣]{2,5}$|^[A-Za-z\\s]{2,20}$')

                if lines:
                    if len(lines) >= 1 and room_pattern.match(lines[-1]):
                        room = lines[-1]
                        lines = lines[:-1]
                    if len(lines) >= 1 and prof_pattern.match(lines[-1]):
                        professor = lines[-1]
                        lines = lines[:-1]
                    course_name = "".join(lines)

                if course_name and start_time and end_time:
                    courses.append({
                        "dayOfWeek": day_num,
                        "startTime": start_time,
                        "endTime": end_time,
                        "courseName": course_name,
                        "professor": professor,
                        "room": room,
                    })

                row_idx = end_row
            else:
                row_idx += 1

    courses.sort(key=lambda c: (c["dayOfWeek"], c["startTime"]))

    return json.dumps({
        "semester": semester,
        "studentId": student_id,
        "studentName": student_name,
        "courses": courses,
    }, ensure_ascii=False)

if __name__ == "__main__":
    print(parse_timetable(sys.argv[1]))
`;

/**
 * PDF Buffer에서 시간표 데이터를 파싱합니다.
 * pymupdf의 테이블 추출 기능을 사용하여 정확한 과목 데이터를 추출합니다.
 */
export async function parseTimetablePdf(buffer: Buffer): Promise<ParsedTimetable> {
  // 임시 파일에 PDF 저장
  const tmpId = randomBytes(8).toString('hex');
  const tmpPdfPath = join(tmpdir(), `timetable_${tmpId}.pdf`);
  const tmpPyPath = join(tmpdir(), `timetable_parser_${tmpId}.py`);

  try {
    await writeFile(tmpPdfPath, buffer);
    await writeFile(tmpPyPath, PYTHON_SCRIPT, 'utf-8');

    // Python 스크립트 실행
    const result = await new Promise<string>((resolve, reject) => {
      execFile('python', [tmpPyPath, tmpPdfPath], {
        encoding: 'utf-8',
        timeout: 30000,
      }, (error, stdout, stderr) => {
        if (error) {
          reject(new Error(`PDF 파싱 실패: ${error.message}\n${stderr}`));
          return;
        }
        resolve(stdout.trim());
      });
    });

    // pymupdf가 stdout에 경고 메시지를 출력할 수 있으므로
    // JSON 부분만 추출 (첫 번째 '{' 부터 마지막 '}' 까지)
    const jsonStart = result.indexOf('{');
    const jsonEnd = result.lastIndexOf('}');
    if (jsonStart === -1 || jsonEnd === -1) {
      throw new Error(`PDF 파싱 결과에서 JSON을 찾을 수 없습니다: ${result.substring(0, 100)}`);
    }
    const jsonStr = result.substring(jsonStart, jsonEnd + 1);

    const parsed = JSON.parse(jsonStr);

    if (parsed.error) {
      throw new Error(parsed.error);
    }

    return {
      semester: parsed.semester || getCurrentSemester(),
      studentId: parsed.studentId || '',
      studentName: parsed.studentName || '',
      courses: (parsed.courses || []).map((c: ParsedCourse) => ({
        dayOfWeek: c.dayOfWeek,
        startTime: c.startTime,
        endTime: c.endTime,
        courseName: c.courseName,
        professor: c.professor || null,
        room: c.room || null,
      })),
    };
  } finally {
    // 임시 파일 정리
    await unlink(tmpPdfPath).catch(() => {});
    await unlink(tmpPyPath).catch(() => {});
  }
}

/**
 * 현재 학기 문자열 반환
 */
function getCurrentSemester(): string {
  const now = new Date();
  const year = now.getFullYear();
  const sem = now.getMonth() < 7 ? 1 : 2;
  return `${year}-${sem}`;
}

/**
 * 자동 색상 배정
 */
const COURSE_COLORS = [
  '#4F6BF0', // 파랑
  '#10B981', // 초록
  '#F59E0B', // 노랑
  '#EF4444', // 빨강
  '#8B5CF6', // 보라
  '#EC4899', // 핑크
  '#06B6D4', // 시안
  '#F97316', // 주황
];

export function assignCourseColors(courses: ParsedCourse[]): Map<string, string> {
  const colorMap = new Map<string, string>();
  const uniqueCourses = [...new Set(courses.map(c => c.courseName))];

  for (let i = 0; i < uniqueCourses.length; i++) {
    colorMap.set(uniqueCourses[i], COURSE_COLORS[i % COURSE_COLORS.length]);
  }

  return colorMap;
}
