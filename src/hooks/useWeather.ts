'use client'

import { useState, useEffect } from 'react'

export type WeatherCondition = 'clear' | 'cloudy' | 'rain' | 'snow' | 'thunder' | 'unknown'

interface WeatherData {
    condition: WeatherCondition
    temperature: number
    weatherCode: number
}

// WMO Weather Code → 간단한 상태로 변환
function getCondition(code: number): WeatherCondition {
    if (code === 0 || code === 1) return 'clear'       // 맑음, 대체로 맑음
    if (code <= 3) return 'cloudy'                       // 구름 많음, 흐림
    if (code <= 48) return 'cloudy'                      // 안개류
    if (code <= 67) return 'rain'                        // 이슬비, 비
    if (code <= 77) return 'snow'                        // 눈
    if (code <= 82) return 'rain'                        // 소나기
    if (code <= 86) return 'snow'                        // 눈 소나기
    if (code >= 95) return 'thunder'                     // 천둥번개
    return 'unknown'
}

// 강릉 고정 좌표
const GANGNEUNG = { latitude: 37.7519, longitude: 128.8761 }

export function useWeather() {
    const [weather, setWeather] = useState<WeatherData | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // 캐시 확인 (30분)
        const cached = sessionStorage.getItem('weather-data')
        if (cached) {
            const { data, timestamp } = JSON.parse(cached)
            if (Date.now() - timestamp < 30 * 60 * 1000) {
                setWeather(data)
                setLoading(false)
                return
            }
        }

        async function fetchWeather() {
            try {
                const res = await fetch(
                    `https://api.open-meteo.com/v1/forecast?latitude=${GANGNEUNG.latitude}&longitude=${GANGNEUNG.longitude}&current=temperature_2m,weather_code,precipitation,rain,snowfall&timezone=Asia/Seoul`
                )
                const json = await res.json()
                const { weather_code, temperature_2m, precipitation, rain, snowfall } = json.current

                // weather_code가 흐림(3)이어도 실제 강수가 있으면 보정
                let effectiveCode = weather_code
                if (weather_code <= 3 && precipitation > 0) {
                    if (snowfall > 0) effectiveCode = 71  // 눈
                    else if (rain > 0) effectiveCode = 61  // 비
                }

                const data: WeatherData = {
                    condition: getCondition(effectiveCode),
                    temperature: temperature_2m,
                    weatherCode: effectiveCode,
                }

                sessionStorage.setItem('weather-data', JSON.stringify({
                    data,
                    timestamp: Date.now(),
                }))

                setWeather(data)
            } catch {
                setWeather({ condition: 'clear', temperature: 0, weatherCode: 0 })
            } finally {
                setLoading(false)
            }
        }

        fetchWeather()
    }, [])

    return { weather, loading }
}
