/* eslint no-nested-ternary: warn */
import {
  mdiArrowDown,
  mdiArrowLeft,
  mdiArrowRight,
  mdiArrowUp,
  mdiBatteryHigh,
  mdiBatteryLow,
  mdiBatteryMedium,
  mdiBatteryOutline,
  mdiHome,
  mdiSolarPower,
  mdiTransmissionTower,
} from "@mdi/js";
import { formatNumber, HomeAssistant } from "custom-card-helpers";
import { css, html, LitElement, svg, TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";
import { RealtimeEnergyDistributionCardConfig } from "./realtime-energy-distribution-card-config.js";

const CIRCLE_CIRCUMFERENCE = 238.76104;

@customElement("realtime-energy-distribution-card")
export class RealtimeEnergyDistributionCard extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @state() private _config?: RealtimeEnergyDistributionCardConfig;

  setConfig(config: RealtimeEnergyDistributionCardConfig): void {
    this._config = config;
  }

  public getCardSize(): Promise<number> | number {
    return 3;
  }

  protected render(): TemplateResult {
    if (!this._config) {
      return html``;
    }

    const speedFactor = 5;

    const hasConsumption = true;

    const hasBattery = true;
    const hasSolarProduction = true;
    const hasReturnToGrid = hasConsumption;

    const singleFractionalDigit = (value: number): number =>
      +formatNumber(value, this.hass.locale, { maximumFractionDigits: 1 });

    const entityValue = (entity: string | undefined): number => {
      if (!entity) return 0;
      return singleFractionalDigit(+this.hass.states[entity].state ?? 0);
    };

    const batteryToHome = entityValue(this._config.battery_to_home_entity);
    const gridToHome = entityValue(this._config.grid_to_home_entity);
    const solarToBattery = entityValue(this._config.solar_to_battery_entity);
    const solarToGrid = entityValue(this._config.solar_to_grid_entity);
    const solarToHome = entityValue(this._config.solar_to_home_entity);
    const batteryCharge = entityValue(this._config.battery_charge_entity);

    const totalSolarProduction = hasSolarProduction
      ? solarToBattery + solarToGrid + solarToHome
      : 0;
    const totalConsumption =
      batteryToHome + gridToHome + solarToHome + solarToGrid;
    const totalHomeConsumption =
      (gridToHome > 0 ? gridToHome : 0) + solarToHome + batteryToHome;
    // TODO: Delete these
    const batteryFromGrid = 0;
    const batteryToGrid = 0;
    // TODO: End Delete These

    // eslint-disable-next-line prefer-const
    let homeBatteryCircumference: number | undefined;
    let homeSolarCircumference: number | undefined;

    let batteryIcon = mdiBatteryHigh;
    if (batteryCharge <= 72 && batteryCharge > 44) {
      batteryIcon = mdiBatteryMedium;
    } else if (batteryCharge <= 44 && batteryCharge > 16) {
      batteryIcon = mdiBatteryLow;
    } else if (batteryCharge <= 16) {
      batteryIcon = mdiBatteryOutline;
    }

    return html`
      <ha-card .header=${this._config.title}>
        <div class="card-content">
          ${hasSolarProduction
            ? html`<div class="circle-container solar">
                <span class="label"
                  >${this.hass.localize(
                    "ui.panel.lovelace.cards.energy.energy_distribution.solar"
                  )}</span
                >
                <div class="circle">
                  <ha-svg-icon .path=${mdiSolarPower}></ha-svg-icon>
                  ${totalSolarProduction > 0
                    ? html` <span class="solar">
                        ${singleFractionalDigit(totalSolarProduction)} kW</span
                      >`
                    : html``}
                </div>
              </div>`
            : html``}
          <div class="row">
            <div class="circle-container grid">
              <div class="circle">
                <ha-svg-icon .path=${mdiTransmissionTower}></ha-svg-icon>
                ${solarToGrid > 0
                  ? html`<span class="return">
                      <ha-svg-icon
                        class="small"
                        .path=${mdiArrowLeft}
                      ></ha-svg-icon
                      >${singleFractionalDigit(solarToGrid)} kW
                    </span>`
                  : html``}
                ${gridToHome > 0
                  ? html`<span class="consumption">
                      <ha-svg-icon
                        class="small"
                        .path=${mdiArrowRight}
                      ></ha-svg-icon
                      >${singleFractionalDigit(gridToHome)} kW
                    </span>`
                  : html``}
              </div>
              <span class="label"
                >${this.hass.localize(
                  "ui.panel.lovelace.cards.energy.energy_distribution.grid"
                )}</span
              >
            </div>
            <div class="circle-container home">
              <div
                class="circle ${classMap({
                  border: homeSolarCircumference === undefined,
                })}"
              >
                <ha-svg-icon .path=${mdiHome}></ha-svg-icon>
                ${singleFractionalDigit(totalHomeConsumption)} kW
                ${homeSolarCircumference !== undefined
                  ? html`<svg>
                      ${homeSolarCircumference !== undefined
                        ? svg`<circle
                            class="solar"
                            cx="40"
                            cy="40"
                            r="38"
                            stroke-dasharray="${homeSolarCircumference} ${
                            CIRCLE_CIRCUMFERENCE - homeSolarCircumference
                          }"
                            shape-rendering="geometricPrecision"
                            stroke-dashoffset="-${
                              CIRCLE_CIRCUMFERENCE - homeSolarCircumference
                            }"
                          />`
                        : ""}
                      ${homeBatteryCircumference
                        ? svg`<circle
                            class="battery"
                            cx="40"
                            cy="40"
                            r="38"
                            stroke-dasharray="${homeBatteryCircumference} ${
                            CIRCLE_CIRCUMFERENCE - homeBatteryCircumference
                          }"
                            stroke-dashoffset="-${
                              CIRCLE_CIRCUMFERENCE -
                              homeBatteryCircumference -
                              (homeSolarCircumference || 0)
                            }"
                            shape-rendering="geometricPrecision"
                          />`
                        : ""}
                    </svg>`
                  : ""}
              </div>
              <span class="label"
                >${this.hass.localize(
                  "ui.panel.lovelace.cards.energy.energy_distribution.home"
                )}</span
              >
            </div>
          </div>
          ${hasBattery
            ? html`<div class="row">
                <div class="spacer"></div>
                <div class="circle-container battery">
                  <div class="circle">
                    <span>
                      ${formatNumber(batteryCharge, this.hass.locale, {
                        maximumFractionDigits: 0,
                        minimumFractionDigits: 0,
                      })}%
                    </span>
                    <ha-svg-icon .path=${batteryIcon}></ha-svg-icon>
                    ${solarToBattery > 0
                      ? html`
                          <span class="battery-in">
                            <ha-svg-icon
                              class="small"
                              .path=${mdiArrowDown}
                            ></ha-svg-icon
                            >${singleFractionalDigit(solarToBattery)} kW</span
                          >
                        `
                      : html``}
                    ${batteryToHome > 0
                      ? html`
                          <span class="battery-out">
                            <ha-svg-icon
                              class="small"
                              .path=${mdiArrowUp}
                            ></ha-svg-icon
                            >${singleFractionalDigit(batteryToHome)} kW</span
                          >
                        `
                      : html``}
                  </div>
                  <span class="label"
                    >${this.hass.localize(
                      "ui.panel.lovelace.cards.energy.energy_distribution.battery"
                    )}</span
                  >
                </div>
                <div class="spacer"></div>
              </div>`
            : ""}
          <div class="lines ${classMap({ battery: hasBattery })}">
            <svg
              viewBox="0 0 100 100"
              xmlns="http://www.w3.org/2000/svg"
              preserveAspectRatio="xMidYMid slice"
            >
              ${hasReturnToGrid && hasSolarProduction
                ? svg`<path
                    id="return"
                    class="return"
                    d="M${hasBattery ? 45 : 47},0 v15 c0,${
                    hasBattery ? "35 -10,30 -30,30" : "40 -10,35 -30,35"
                  } h-20"
                    vector-effect="non-scaling-stroke"
                  ></path> `
                : ""}
              ${hasSolarProduction
                ? svg`<path
                    id="solar"
                    class="solar"
                    d="M${hasBattery ? 55 : 53},0 v15 c0,${
                    hasBattery ? "35 10,30 30,30" : "40 10,35 30,35"
                  } h25"
                    vector-effect="non-scaling-stroke"
                  ></path>`
                : ""}
              ${hasBattery
                ? svg`<path
                    id="battery-home"
                    class="battery-home"
                    d="M55,100 v-15 c0,-35 10,-30 30,-30 h20"
                    vector-effect="non-scaling-stroke"
                  ></path>
                  <path
                    id="battery-grid"
                    class=${classMap({
                      "battery-from-grid": Boolean(batteryFromGrid),
                      "battery-to-grid": Boolean(batteryToGrid),
                    })}
                    d="M45,100 v-15 c0,-35 -10,-30 -30,-30 h-20"
                    vector-effect="non-scaling-stroke"
                  ></path>
                  `
                : ""}
              ${hasBattery && hasSolarProduction
                ? svg`<path
                    id="battery-solar"
                    class="battery-solar"
                    d="M50,0 V100"
                    vector-effect="non-scaling-stroke"
                  ></path>`
                : ""}
              <path
                class="grid"
                id="grid"
                d="M0,${hasBattery ? 50 : hasSolarProduction ? 56 : 53} H100"
                vector-effect="non-scaling-stroke"
              ></path>
              ${solarToGrid && hasSolarProduction
                ? svg`<circle
                    r="1"
                    class="return"
                    vector-effect="non-scaling-stroke"
                  >
                    <animateMotion
                      dur="${
                        (1 - solarToGrid / totalConsumption) * speedFactor
                      }s"
                      repeatCount="indefinite"
                      calcMode="linear"
                    >
                      <mpath xlink:href="#return" />
                    </animateMotion>
                  </circle>`
                : ""}
              ${solarToHome
                ? svg`<circle
                    r="1"
                    class="solar"
                    vector-effect="non-scaling-stroke"
                  >
                    <animateMotion
                      dur="${
                        (1 - solarToHome / totalConsumption) * speedFactor
                      }s"
                      repeatCount="indefinite"
                      calcMode="linear"
                    >
                      <mpath xlink:href="#solar" />
                    </animateMotion>
                  </circle>`
                : ""}
              ${solarToBattery
                ? svg`<circle
                    r="1"
                    class="battery-solar"
                    vector-effect="non-scaling-stroke"
                  >
                    <animateMotion
                      dur="${
                        (1 - solarToBattery / totalConsumption) * speedFactor
                      }s"
                      repeatCount="indefinite"
                      calcMode="linear"
                    >
                      <mpath xlink:href="#battery-solar" />
                    </animateMotion>
                  </circle>`
                : ""}
              ${batteryToHome > 0
                ? svg`<circle
                    r="1"
                    class="battery-home"
                    vector-effect="non-scaling-stroke"
                  >
                    <animateMotion
                      dur="${
                        (1 - batteryToHome / totalConsumption) * speedFactor
                      }s"
                      repeatCount="indefinite"
                      calcMode="linear"
                    >
                      <mpath xlink:href="#battery-home" />
                    </animateMotion>
                  </circle>`
                : ""}
            </svg>
          </div>
        </div></ha-card
      >
    `;
  }

  static styles = css`
    :host {
      --mdc-icon-size: 24px;
    }
    .card-content {
      position: relative;
    }
    .lines {
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 146px;
      display: flex;
      justify-content: center;
      padding: 0 16px 16px;
      box-sizing: border-box;
    }
    .lines.battery {
      bottom: 100px;
      height: 156px;
    }
    .lines svg {
      width: calc(100% - 160px);
      height: 100%;
      max-width: 340px;
    }
    .row {
      display: flex;
      justify-content: space-between;
      max-width: 500px;
      margin: 0 auto;
    }
    .circle-container {
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .circle-container.solar {
      margin: 0 4px;
      height: 130px;
    }
    .circle-container.battery {
      height: 110px;
      justify-content: flex-end;
    }
    .spacer {
      width: 84px;
    }
    .circle {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      box-sizing: border-box;
      border: 2px solid;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      font-size: 12px;
      line-height: 12px;
      position: relative;
      text-decoration: none;
      color: var(--primary-text-color);
    }
    ha-svg-icon {
      padding-bottom: 2px;
    }
    ha-svg-icon.small {
      --mdc-icon-size: 12px;
    }
    .label {
      color: var(--secondary-text-color);
      font-size: 12px;
    }
    line,
    path {
      stroke: var(--primary-text-color);
      stroke-width: 1;
      fill: none;
    }
    .circle svg {
      position: absolute;
      fill: none;
      stroke-width: 4px;
      width: 100%;
      height: 100%;
      top: 0;
      left: 0;
    }
    .solar {
      color: var(--energy-solar-color);
    }
    .solar .circle {
      border-color: var(--energy-solar-color);
    }
    circle.solar,
    path.solar {
      stroke: var(--energy-solar-color);
    }
    circle.solar {
      stroke-width: 4;
      fill: var(--energy-solar-color);
    }
    .battery .circle {
      border-color: var(--energy-battery-in-color);
    }
    circle.battery,
    path.battery {
      stroke: var(--energy-battery-out-color);
    }
    path.battery-home,
    circle.battery-home {
      stroke: var(--energy-battery-out-color);
    }
    circle.battery-home {
      stroke-width: 4;
      fill: var(--energy-battery-out-color);
    }
    path.battery-solar,
    circle.battery-solar {
      stroke: var(--energy-battery-in-color);
    }
    circle.battery-solar {
      stroke-width: 4;
      fill: var(--energy-battery-in-color);
    }
    .battery-in {
      color: var(--energy-battery-in-color);
    }
    .battery-out {
      color: var(--energy-battery-out-color);
    }
    path.return,
    circle.return,
    circle.battery-to-grid {
      stroke: var(--energy-grid-return-color);
    }
    circle.return,
    circle.battery-to-grid {
      stroke-width: 4;
      fill: var(--energy-grid-return-color);
    }
    .return {
      color: var(--energy-grid-return-color);
    }
    .grid .circle {
      border-color: var(--energy-grid-consumption-color);
    }
    .consumption {
      color: var(--energy-grid-consumption-color);
    }
    circle.grid,
    circle.battery-from-grid,
    path.grid {
      stroke: var(--energy-grid-consumption-color);
    }
    circle.grid,
    circle.battery-from-grid {
      stroke-width: 4;
      fill: var(--energy-grid-consumption-color);
    }
    .home .circle {
      border-width: 0;
      border-color: var(--primary-color);
    }
    .home .circle.border {
      border-width: 2px;
    }
    .circle svg circle {
      animation: rotate-in 0.6s ease-in;
      transition: stroke-dashoffset 0.4s, stroke-dasharray 0.4s;
      fill: none;
    }
    @keyframes rotate-in {
      from {
        stroke-dashoffset: 238.76104;
        stroke-dasharray: 238.76104;
      }
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "realtime-energy-distribution-card": RealtimeEnergyDistributionCard;
  }
}
