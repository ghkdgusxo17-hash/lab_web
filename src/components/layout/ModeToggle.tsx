'use client'

import { useWeather, WeatherCondition } from '@/hooks/useWeather'

interface ModeToggleProps {
    isWork: boolean
    isDark: boolean
    onChange: () => void
}

export function ModeToggle({ isWork, isDark, onChange }: ModeToggleProps) {
    const { weather } = useWeather()
    const condition = weather?.condition || 'clear'

    return (
        <div className="relative" style={{ width: '80px', height: '32px' }}>
            <label
                style={{ transform: 'scale(0.5)', transformOrigin: 'top left', display: 'inline-block', cursor: 'pointer' }}
                title={isWork ? '홈페이지 모드로 전환' : '연구실 모드로 전환'}
            >
                <input
                    type="checkbox"
                    checked={isWork}
                    onChange={onChange}
                    className="hidden"
                />
                {isDark
                    ? <DarkToggle isWork={isWork} />
                    : <LightToggle isWork={isWork} condition={condition} />
                }
            </label>
        </div>
    )
}

/* ========== 라이트모드 토글 (날씨별) ========== */
function LightToggle({ isWork, condition }: { isWork: boolean; condition: WeatherCondition }) {
    // 날씨별 토글 분기 - 새 날씨 토글 추가 시 여기에 case 추가
    switch (condition) {
        case 'rain':
            return <RainToggle isWork={isWork} />
        case 'snow':
            return <SnowToggle isWork={isWork} />
        case 'cloudy':
            return <CloudyToggle isWork={isWork} />
        case 'thunder':
            return <ThunderToggle isWork={isWork} />
        case 'clear':
        default:
            return <ClearToggle isWork={isWork} />
    }
}

/* ========== 맑음 (hail_toggle) ========== */
function ClearToggle({ isWork }: { isWork: boolean }) {
    return (
        <div className={`hail-track ${isWork ? 'active' : ''}`}>
            <div className={`hail-scenery-home ${isWork ? 'hide' : ''}`}>
                <svg className="hail-cloud hail-cloud-1" viewBox="0 0 24 24">
                    <path d="M17.5 19C19.9853 19 22 16.9853 22 14.5C22 12.1336 20.1774 10.2013 17.8644 10.0163C17.4146 7.1865 14.9657 5 12 5C8.68629 5 6 7.68629 6 11C6 11.026 6.00016 11.0518 6.00049 11.0776C3.76672 11.3934 2 13.2505 2 15.5C2 17.9853 4.01472 20 6.5 20L17.5 19Z" />
                </svg>
                <svg className="hail-cloud hail-cloud-2" viewBox="0 0 24 24">
                    <path d="M17.5 19C19.9853 19 22 16.9853 22 14.5C22 12.1336 20.1774 10.2013 17.8644 10.0163C17.4146 7.1865 14.9657 5 12 5C8.68629 5 6 7.68629 6 11C6 11.026 6.00016 11.0518 6.00049 11.0776C3.76672 11.3934 2 13.2505 2 15.5C2 17.9853 4.01472 20 6.5 20L17.5 19Z" />
                </svg>
            </div>
            <div className={`hail-scenery-lab ${isWork ? 'show' : ''}`}>
                <svg className="hail-node hail-node-1" viewBox="0 0 24 24">
                    <circle cx="6" cy="12" r="3" fill="currentColor" />
                    <circle cx="18" cy="6" r="3" fill="currentColor" />
                    <circle cx="18" cy="18" r="3" fill="currentColor" />
                    <line x1="6" y1="12" x2="18" y2="6" />
                    <line x1="6" y1="12" x2="18" y2="18" />
                </svg>
                <svg className="hail-node hail-node-2" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="3" fill="currentColor" />
                    <circle cx="20" cy="8" r="3" fill="currentColor" />
                    <line x1="12" y1="12" x2="20" y2="8" />
                </svg>
            </div>
            <div className={`hail-thumb ${isWork ? 'active' : ''}`}>
                <div className={`hail-thumb-home ${isWork ? 'hide' : ''}`} />
                <div className={`hail-thumb-lab ${isWork ? 'show' : ''}`}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="3" />
                        <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(45 12 12)" />
                        <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(-45 12 12)" />
                    </svg>
                </div>
            </div>
        </div>
    )
}

/* ========== 다크모드 (dark_toggle) ========== */
function DarkToggle({ isWork }: { isWork: boolean }) {
    return (
        <div className={`dark-track ${isWork ? 'active' : ''}`}>
            <div className={`dark-scenery-night ${isWork ? 'hide' : ''}`}>
                <div className="dark-star dark-star-1" />
                <div className="dark-star dark-star-2" />
                <div className="dark-star dark-star-3" />
                <div className="dark-star dark-star-4" />
            </div>
            <div className={`dark-scenery-lab ${isWork ? 'show' : ''}`}>
                <svg className="dark-node dark-node-1" viewBox="0 0 24 24">
                    <circle cx="6" cy="12" r="3" fill="currentColor" />
                    <circle cx="18" cy="6" r="3" fill="currentColor" />
                    <circle cx="18" cy="18" r="3" fill="currentColor" />
                    <line x1="6" y1="12" x2="18" y2="6" />
                    <line x1="6" y1="12" x2="18" y2="18" />
                </svg>
                <svg className="dark-node dark-node-2" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="3" fill="currentColor" />
                    <circle cx="20" cy="8" r="3" fill="currentColor" />
                    <line x1="12" y1="12" x2="20" y2="8" />
                </svg>
            </div>
            <div className={`dark-thumb ${isWork ? 'active' : ''}`}>
                <div className={`dark-thumb-moon ${isWork ? 'hide' : ''}`}>
                    <div className="dark-crater dark-crater-1" />
                    <div className="dark-crater dark-crater-2" />
                    <div className="dark-crater dark-crater-3" />
                </div>
                <div className={`dark-thumb-lab ${isWork ? 'show' : ''}`}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="3" />
                        <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(45 12 12)" />
                        <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(-45 12 12)" />
                    </svg>
                </div>
            </div>
        </div>
    )
}

/* ========== 비 (Rainny.html) ========== */
function RainToggle({ isWork }: { isWork: boolean }) {
    const cloudPath = "M17.5 19C19.9853 19 22 16.9853 22 14.5C22 12.1336 20.1774 10.2013 17.8644 10.0163C17.4146 7.1865 14.9657 5 12 5C8.68629 5 6 7.68629 6 11C6 11.026 6.00016 11.0518 6.00049 11.0776C3.76672 11.3934 2 13.2505 2 15.5C2 17.9853 4.01472 20 6.5 20L17.5 19Z"
    return (
        <div className={`rain-track ${isWork ? 'active' : ''}`}>
            <div className={`rain-scenery-home ${isWork ? 'hide' : ''}`}>
                <svg className="rain-bg-cloud" style={{ left: '15px' }} viewBox="0 0 24 24">
                    <path d={cloudPath} />
                </svg>
                <svg className="rain-bg-cloud" style={{ left: '85px', width: '45px', top: '8px', opacity: 0.7 }} viewBox="0 0 24 24">
                    <path d={cloudPath} />
                </svg>
                <div className="rain-drop rain-d1" />
                <div className="rain-drop rain-d2" />
                <div className="rain-drop rain-d3" />
                <div className="rain-drop rain-d4" />
                <div className="rain-drop rain-d5" />
                <div className="rain-drop rain-d6" />
                <div className="rain-drop rain-d7" />
                <div className="rain-drop rain-d8" />
            </div>
            <div className={`rain-scenery-lab ${isWork ? 'show' : ''}`}>
                <svg className="rain-node rain-node-1" viewBox="0 0 24 24">
                    <circle cx="6" cy="12" r="3" fill="currentColor" />
                    <circle cx="18" cy="6" r="3" fill="currentColor" />
                    <circle cx="18" cy="18" r="3" fill="currentColor" />
                    <line x1="6" y1="12" x2="18" y2="6" />
                    <line x1="6" y1="12" x2="18" y2="18" />
                </svg>
                <svg className="rain-node rain-node-2" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="3" fill="currentColor" />
                    <circle cx="20" cy="8" r="3" fill="currentColor" />
                    <line x1="12" y1="12" x2="20" y2="8" />
                </svg>
            </div>
            <div className={`rain-thumb ${isWork ? 'active' : ''}`}>
                <div className={`rain-thumb-home ${isWork ? 'hide' : ''}`}>
                    <svg viewBox="0 0 24 24">
                        <path d="M6 19v2M10 19v2M14 19v2M18 19v2" />
                        <path d={cloudPath} fill="#cbd5e1" stroke="none" />
                    </svg>
                </div>
                <div className={`rain-thumb-lab ${isWork ? 'show' : ''}`}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="3" />
                        <line x1="12" y1="4" x2="12" y2="20" />
                        <line x1="4" y1="12" x2="20" y2="12" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                        <line x1="6" y1="18" x2="18" y2="6" />
                    </svg>
                </div>
            </div>
        </div>
    )
}

/* ========== 눈 (Snow.html) ========== */
function SnowToggle({ isWork }: { isWork: boolean }) {
    return (
        <div className={`snow-track ${isWork ? 'active' : ''}`}>
            <div className={`snow-scenery-home ${isWork ? 'hide' : ''}`}>
                <div className="snow-flake snow-flake-1" />
                <div className="snow-flake snow-flake-2" />
                <div className="snow-flake snow-flake-3" />
                <div className="snow-flake snow-flake-4" />
                <div className="snow-flake snow-flake-5" />
            </div>
            <div className={`snow-scenery-lab ${isWork ? 'show' : ''}`}>
                <svg className="snow-node snow-node-1" viewBox="0 0 24 24">
                    <circle cx="6" cy="12" r="3" fill="currentColor" />
                    <circle cx="18" cy="6" r="3" fill="currentColor" />
                    <circle cx="18" cy="18" r="3" fill="currentColor" />
                    <line x1="6" y1="12" x2="18" y2="6" />
                    <line x1="6" y1="12" x2="18" y2="18" />
                </svg>
                <svg className="snow-node snow-node-2" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="3" fill="currentColor" />
                    <circle cx="20" cy="8" r="3" fill="currentColor" />
                    <line x1="12" y1="12" x2="20" y2="8" />
                </svg>
            </div>
            <div className={`snow-thumb ${isWork ? 'active' : ''}`}>
                <div className={`snow-thumb-home ${isWork ? 'hide' : ''}`}>
                    <svg viewBox="0 0 24 24">
                        <path d="M12 2v20M2 12h20M4.9 4.9l14.2 14.2M4.9 19.1l14.2-14.2" />
                        <circle cx="12" cy="12" r="3" fill="#60a5fa" stroke="none" />
                    </svg>
                </div>
                <div className={`snow-thumb-lab ${isWork ? 'show' : ''}`}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="3" />
                        <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(45 12 12)" />
                        <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(-45 12 12)" />
                    </svg>
                </div>
            </div>
        </div>
    )
}

/* ========== 흐림 (cloudy.html) ========== */
function CloudyToggle({ isWork }: { isWork: boolean }) {
    const cloudPath = "M17.5 19C19.9853 19 22 16.9853 22 14.5C22 12.1336 20.1774 10.2013 17.8644 10.0163C17.4146 7.1865 14.9657 5 12 5C8.68629 5 6 7.68629 6 11C6 11.026 6.00016 11.0518 6.00049 11.0776C3.76672 11.3934 2 13.2505 2 15.5C2 17.9853 4.01472 20 6.5 20L17.5 19Z"
    return (
        <div className={`cloudy-track ${isWork ? 'active' : ''}`}>
            <div className={`cloudy-scenery-home ${isWork ? 'hide' : ''}`}>
                <svg className="cloudy-cloud cloudy-cloud-1" viewBox="0 0 24 24">
                    <path d={cloudPath} />
                </svg>
                <svg className="cloudy-cloud cloudy-cloud-2" viewBox="0 0 24 24">
                    <path d={cloudPath} />
                </svg>
                <svg className="cloudy-cloud cloudy-cloud-3" viewBox="0 0 24 24">
                    <path d={cloudPath} />
                </svg>
            </div>
            <div className={`cloudy-scenery-lab ${isWork ? 'show' : ''}`}>
                <svg className="cloudy-node cloudy-node-1" viewBox="0 0 24 24">
                    <circle cx="6" cy="12" r="3" fill="currentColor" />
                    <circle cx="18" cy="6" r="3" fill="currentColor" />
                    <circle cx="18" cy="18" r="3" fill="currentColor" />
                    <line x1="6" y1="12" x2="18" y2="6" />
                    <line x1="6" y1="12" x2="18" y2="18" />
                </svg>
                <svg className="cloudy-node cloudy-node-2" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="3" fill="currentColor" />
                    <circle cx="20" cy="8" r="3" fill="currentColor" />
                    <line x1="12" y1="12" x2="20" y2="8" />
                </svg>
            </div>
            <div className={`cloudy-thumb ${isWork ? 'active' : ''}`}>
                <div className={`cloudy-thumb-home ${isWork ? 'hide' : ''}`}>
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d={cloudPath} />
                    </svg>
                </div>
                <div className={`cloudy-thumb-lab ${isWork ? 'show' : ''}`}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="3" />
                        <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(45 12 12)" />
                        <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(-45 12 12)" />
                    </svg>
                </div>
            </div>
        </div>
    )
}

/* ========== 천둥번개 (thunder.html) ========== */
function ThunderToggle({ isWork }: { isWork: boolean }) {
    const cloudPath = "M17.5 19C19.9853 19 22 16.9853 22 14.5C22 12.1336 20.1774 10.2013 17.8644 10.0163C17.4146 7.1865 14.9657 5 12 5C8.68629 5 6 7.68629 6 11C6 11.026 6.00016 11.0518 6.00049 11.0776C3.76672 11.3934 2 13.2505 2 15.5C2 17.9853 4.01472 20 6.5 20L17.5 19Z"
    return (
        <div className={`thunder-track ${isWork ? 'active' : ''}`}>
            <div className={`thunder-scenery-home ${isWork ? 'hide' : ''}`}>
                {/* 번개 (구름 뒤) */}
                <svg className="thunder-lightning" viewBox="0 0 24 24">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
                {/* 먹구름 */}
                <svg className="thunder-storm-cloud" viewBox="0 0 24 24">
                    <path d={cloudPath} />
                </svg>
                <svg className="thunder-storm-cloud thunder-storm-cloud-2" viewBox="0 0 24 24">
                    <path d={cloudPath} />
                </svg>
                {/* 빗방울 */}
                <div className="thunder-h-drop thunder-h1" />
                <div className="thunder-h-drop thunder-h2" />
                <div className="thunder-h-drop thunder-h3" />
                <div className="thunder-h-drop thunder-h4" />
                <div className="thunder-h-drop thunder-h5" />
                <div className="thunder-h-drop thunder-h6" />
                <div className="thunder-h-drop thunder-h7" />
                <div className="thunder-h-drop thunder-h8" />
                <div className="thunder-h-drop thunder-h9" />
            </div>
            <div className={`thunder-scenery-lab ${isWork ? 'show' : ''}`}>
                <svg className="thunder-node thunder-node-1" viewBox="0 0 24 24">
                    <circle cx="6" cy="12" r="3" fill="currentColor" />
                    <circle cx="18" cy="6" r="3" fill="currentColor" />
                    <circle cx="18" cy="18" r="3" fill="currentColor" />
                    <line x1="6" y1="12" x2="18" y2="6" />
                    <line x1="6" y1="12" x2="18" y2="18" />
                </svg>
                <svg className="thunder-node thunder-node-2" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="3" fill="currentColor" />
                    <circle cx="20" cy="8" r="3" fill="currentColor" />
                    <line x1="12" y1="12" x2="20" y2="8" />
                </svg>
            </div>
            <div className={`thunder-thumb ${isWork ? 'active' : ''}`}>
                <div className={`thunder-thumb-home ${isWork ? 'hide' : ''}`}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d={cloudPath} fill="#64748b" stroke="none" />
                        <path d="M11 13l-2 4h3l-1 4" stroke="#facc15" strokeWidth="2.5" />
                    </svg>
                </div>
                <div className={`thunder-thumb-lab ${isWork ? 'show' : ''}`}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="3" />
                        <line x1="12" y1="4" x2="12" y2="20" />
                        <line x1="4" y1="12" x2="20" y2="12" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                        <line x1="6" y1="18" x2="18" y2="6" />
                    </svg>
                </div>
            </div>
        </div>
    )
}
