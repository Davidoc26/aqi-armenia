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

import Gio from "gi://Gio";
import { AQIColor } from "./constants.js";


export class AQIColorProvider {

  constructor(private settings: Gio.Settings) { }

  public isColorized(): boolean {
    return this.settings.get_boolean("colorized");
  }

  public getColor(aqi: number | string): AQIColor {
    const value = Number(aqi);

    if (Number.isNaN(value)) return AQIColor.Default;
    if (value <= 50) return AQIColor.Good;
    if (value <= 100) return AQIColor.Moderate;
    if (value <= 150) return AQIColor.UnhealthyForSensitiveGroups;
    if (value <= 200) return AQIColor.Unhealthy;
    if (value <= 300) return AQIColor.VeryUnhealthy;

    return AQIColor.Hazardous;
  }

}
