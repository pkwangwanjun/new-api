/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
/**
 * Application-wide constants
 */

// System Configuration Defaults
export const DEFAULT_SYSTEM_NAME = 'New API'
export const DEFAULT_LOGO = '/kyvolen.ico'
export const PLATFORM_SYSTEM_NAME = 'kyvolen'
export const LEGACY_TOKEN_POOL_LOGO = '/TokenPool.png'

export function resolveSystemName(
  systemName?: string | null,
  fallback = DEFAULT_SYSTEM_NAME
) {
  const value = systemName?.trim()
  if (!value) return fallback
  if (value === 'Token Pool' || value === 'TokenPool') {
    return PLATFORM_SYSTEM_NAME
  }
  return value
}

export function resolveLogo(logo?: string | null) {
  return logo === LEGACY_TOKEN_POOL_LOGO ? DEFAULT_LOGO : logo || DEFAULT_LOGO
}

// LocalStorage Keys
export const STORAGE_KEYS = {
  SYSTEM_NAME: 'system_name',
  LOGO: 'logo',
  FOOTER_HTML: 'footer_html',
} as const
