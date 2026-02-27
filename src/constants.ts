/*
 * AQI Armenia GNOME Shell Extension
 *
 * Copyright (C) 2026 David Eritsyan <dav.eritsyan@gmail.com>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

export const CITIES = [
  "Yerevan",
  "Gyumri"
] as const;

export type City = (typeof CITIES)[number];

export enum AQIColor {
  Good = "#00e400",
  Moderate = "#ffff00",
  UnhealthyForSensitiveGroups = "#ff7e00",
  Unhealthy = "#ff0000",
  VeryUnhealthy = "#8f3f97",
  Hazardous = "#7e0023",

  Default = "#999999",
}
