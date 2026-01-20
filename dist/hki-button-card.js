// HKI Button Card

const CARD_NAME_LIGHT = "hki-button-card";

console.info(
  '%c HKI-BUTTON-CARD %c v1.0.3 ',
  'color: white; background: #00C853; font-weight: bold;',
  'color: #00C853; background: white; font-weight: bold;'
);

(function() {
  const _getLit = () => {
    const base =
      customElements.get("hui-masonry-view") ||
      customElements.get("ha-panel-lovelace") ||
      customElements.get("ha-app");
    const LitElement = base ? Object.getPrototypeOf(base) : window.LitElement;
    const html = LitElement?.prototype?.html || window.html;
    const css = LitElement?.prototype?.css || window.css;
    return { LitElement, html, css };
  };

  const { LitElement, html, css } = _getLit();

  const CARD_TYPE = "hki-button-card";
  const EDITOR_TAG = "hki-button-card-editor";

  const HVAC_COLORS = {
    heat: "#FF5722", cool: "#2196F3", heat_cool: "#4CAF50", auto: "#4CAF50",
    dry: "#FFC107", fan_only: "#9E9E9E", off: "#424242"
  };
  const HVAC_ICONS = {
    heat: "mdi:fire", cool: "mdi:snowflake", heat_cool: "mdi:autorenew", auto: "mdi:autorenew",
    dry: "mdi:water-percent", fan_only: "mdi:fan", off: "mdi:power"
  };

  const COLOR_PRESETS = [
    { name: "Warm White", temp: 2700, color: "#FFE4B5" },
    { name: "Soft White", temp: 3000, color: "#FFECD2" },
    { name: "Neutral", temp: 4000, color: "#FFF5E6" },
    { name: "Cool White", temp: 5000, color: "#F5F5FF" },
    { name: "Daylight", temp: 6500, color: "#E8F0FF" },
    { name: "Red", rgb: [255, 0, 0], color: "#FF0000" },
    { name: "Orange", rgb: [255, 165, 0], color: "#FFA500" },
    { name: "Yellow", rgb: [255, 255, 0], color: "#FFFF00" },
    { name: "Green", rgb: [0, 255, 0], color: "#00FF00" },
    { name: "Cyan", rgb: [0, 255, 255], color: "#00FFFF" },
    { name: "Blue", rgb: [0, 0, 255], color: "#0000FF" },
    { name: "Purple", rgb: [128, 0, 128], color: "#800080" },
    { name: "Pink", rgb: [255, 105, 180], color: "#FF69B4" },
  ];

  // Convert HSV (H:0-360, S:0-100, V:0-100) to RGB array [r,g,b]
  const _hsvToRgb = (h, sPct, vPct = 100) => {
    const H = ((Number(h) % 360) + 360) % 360;
    const S = Math.max(0, Math.min(100, Number(sPct))) / 100;
    const V = Math.max(0, Math.min(100, Number(vPct))) / 100;

    const C = V * S;
    const X = C * (1 - Math.abs(((H / 60) % 2) - 1));
    const m = V - C;

    let r = 0, g = 0, b = 0;
    if (H < 60) { r = C; g = X; b = 0; }
    else if (H < 120) { r = X; g = C; b = 0; }
    else if (H < 180) { r = 0; g = C; b = X; }
    else if (H < 240) { r = 0; g = X; b = C; }
    else if (H < 300) { r = X; g = 0; b = C; }
    else { r = C; g = 0; b = X; }

    return [
      Math.round((r + m) * 255),
      Math.round((g + m) * 255),
      Math.round((b + m) * 255),
    ];
  };

  // Local favorites storage (per-entity)
  const __hkiFavKey = (entityId) => `hki_button_card_favorites::${entityId}`;
  const __hkiSeedFavorites = () => COLOR_PRESETS.map((p, i) => {
    const out = { id: `seed_${i}`, name: p.name, color: p.color };
    if (p.temp) {
      out.type = 'temp';
      out.kelvin = p.temp;
      out.color_temp = Math.round(1000000 / p.temp);
    } else if (p.rgb) {
      out.type = 'rgb';
      out.rgb_color = p.rgb;
    }
    return out;
  });


  // Prevent background page scroll when any popup is open
  let __hkiPrevBodyScroll = null;
  let __hkiPrevBodyPosition = null;
  let __hkiPrevBodyTop = null;
  let __hkiScrollY = 0;
  const __hkiLockScroll = () => {
    try {
      if (__hkiPrevBodyScroll !== null) return;
      __hkiScrollY = window.scrollY || window.pageYOffset || 0;
      __hkiPrevBodyScroll = document.body.style.overflow;
      __hkiPrevBodyPosition = document.body.style.position;
      __hkiPrevBodyTop = document.body.style.top;
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${__hkiScrollY}px`;
      document.body.style.width = '100%';
    } catch (e) {}
  };
  const __hkiUnlockScroll = () => {
    try {
      if (__hkiPrevBodyScroll === null) return;
      document.body.style.overflow = __hkiPrevBodyScroll || '';
      document.body.style.position = __hkiPrevBodyPosition || '';
      document.body.style.top = __hkiPrevBodyTop || '';
      document.body.style.width = '';
      window.scrollTo(0, __hkiScrollY || 0);
    } catch (e) {}
    __hkiPrevBodyScroll = null;
    __hkiPrevBodyPosition = null;
    __hkiPrevBodyTop = null;
    __hkiScrollY = 0;
  };

  



class HkiButtonCard extends LitElement {
    
    static getConfigElement() {
      return document.createElement(EDITOR_TAG);
    }

    static getStubConfig() {
      return {
        entity: "light.living_room",
      };
    }

    static get properties() {
      return {
        hass: {},
        _config: { state: true },
        _popupOpen: { state: true },
        _activeView: { state: true },
        _brightness: { state: true },
        _expandedEffects: { state: true }, 
        _tempMin: { state: true },
        _tempMax: { state: true },
        _step: { state: true }
      };
    }

    constructor() {
      super();
      this._popupOpen = false;
      this._popupPortal = null;
      this._activeView = 'brightness'; // brightness, temperature, color
      this._favoritesEditMode = false;
      this._lightFavorites = null;
      this._groupMemberModes = {};
      this._holdTimer = null;
      this._tapTimer = null;
      this._brightness = 100;
      this._hue = 0;
      this._saturation = 0; 
      this._isDragging = false;
      this._expandedEffects = false;
      this._tempMin = 7;
      this._tempMax = 35;
      this._step = 0.5;
    }

    setConfig(config) {
      if (!config || !config.entity) throw new Error("Entity is required");
      this._config = {
        show_name: true,
        show_state: true,
        show_brightness: true,
        show_scenes_button: true,
        show_individual_button: true,
        show_effects_button: true,
        show_popup_scenes: true,
        show_popup_effects: true,
        bar_border_radius: 40,
        dynamic_bar_color: true,
        popup_slider_radius: 12,
        popup_value_font_size: 36,
        popup_value_font_weight: 300,
        popup_label_font_size: 16,
        popup_label_font_weight: 400,
        popup_time_format: 'auto',
        ...config,
      };

      // Normalize icon value. Some editor environments pass a non-string (object)
      // which would render as "[object Object]". If icon is not a real string,
      // fall back to HA's default entity icon.
      if (this._config.icon && (typeof this._config.icon !== 'string' || this._config.icon === '[object Object]')) {
        this._config.icon = '';
      }

      // Ensure these text override fields remain strings so Jinja templates don't end up as "[object Object]".
      // Some editors (notably YAML-based ones) may coerce the value into an object.
      const __coerceTemplateString = (v) => {
        if (v === undefined || v === null) return "";
        if (typeof v === "string") return v;
        if (typeof v === "number" || typeof v === "boolean") return String(v);
        if (typeof v === "object") {
          // Common shapes we may see from editors
          if (typeof v.value === "string") return v.value;
          if (typeof v.template === "string") return v.template;
          return "";
        }
        return "";
      };

      ["name", "state_label", "label", "info_display_override"].forEach((k) => {
        const v = this._config[k];
        if (v !== undefined && v !== null && typeof v !== "string") {
          this._config[k] = __coerceTemplateString(v);
        }
        if (this._config[k] === "[object Object]") this._config[k] = "";
      });

      // Initialize template state
      if (!this._tpl) {
        this._tpl = {
          timer: 0,
          name: { raw: "", sig: "", seq: 0, unsub: null },
          state_label: { raw: "", sig: "", seq: 0, unsub: null },
          label: { raw: "", sig: "", seq: 0, unsub: null },
          info_display_override: { raw: "", sig: "", seq: 0, unsub: null },
        };
      }
      
      // Trigger template setup if hass is available
      if (this.hass) {
        this._scheduleTemplateSetup();
      }
    }

    _isTemplateString(s) {
      if (typeof s !== "string") return false;
      return s.includes("{{") || s.includes("{%") || s.includes("{#");
    }

    _scheduleTemplateSetup(delayMs = 0) {
      if (this._tpl.timer) clearTimeout(this._tpl.timer);
      this._tpl.timer = setTimeout(() => {
        this._tpl.timer = 0;
        this._setupTemplates();
      }, Math.max(0, delayMs));
    }

    _setupTemplates() {
      this._setupTemplateKey("name", this._config?.name ?? "");
      this._setupTemplateKey("state_label", this._config?.state_label ?? "");
      this._setupTemplateKey("label", this._config?.label ?? "");
      this._setupTemplateKey("info_display_override", this._config?.info_display_override ?? "");
    }

    _setupTemplateKey(key, raw) {
      const isTpl = this._isTemplateString(raw);

      // Make standalone "{{ user }}" behave like "{{ user.name }}".
      // Jinja will otherwise stringify the full user object/dict.
      // This keeps "{{ user.name }}" and other properties working as-is.
      const template = (typeof raw === "string")
        ? raw.replace(/{{\s*user\s*}}/g, "{{ user.name }}")
        : raw;

      if (!isTpl) {
        this._unsubscribeTemplate(key);
        this._tpl[key].raw = raw;
        this._tpl[key].sig = "";
        this._setRendered(key, raw);
        return;
      }

      this._setRendered(key, raw);

      // Template variables for text overrides
      // - config: the card config
      // - user: current Home Assistant user (if available)
      //   Ensure {{ user }} renders as the user's name (instead of "[object Object]")
      //   while still allowing {{ user.name }} and other properties.
      const __rawUser = this.hass?.user ?? {};
      const user = (typeof __rawUser === 'object' && __rawUser)
        ? { ...__rawUser }
        : {};
      try {
        const __name = __rawUser?.name ?? '';
        user.toString = () => __name;
        user.valueOf = () => __name;
        if (typeof Symbol !== 'undefined' && Symbol.toPrimitive) {
          user[Symbol.toPrimitive] = () => __name;
        }
      } catch (e) {}

      const vars = { config: this._config ?? {}, user };
      const sig = this._cacheKey(template, vars);
      const state = this._tpl[key];

      this._unsubscribeTemplate(key);
      state.raw = raw;
      state.sig = sig;
      state.seq += 1;
      const seq = state.seq;

      const hadCache = this._applyCachedTemplate(key, sig);

      if (this.hass?.connection?.subscribeMessage) {
        this._subscribeTemplateImmediate(key, seq, template, vars, sig);
      } else if (this.hass?.callWS && !hadCache) {
        this._renderTemplateOnce(key, seq, template, vars, sig);
      }
    }

    _cacheKey(template, vars) {
      return `tpl_${JSON.stringify({ template, vars })}`;
    }

    _applyCachedTemplate(key, sig) {
      try {
        const cached = sessionStorage.getItem(sig);
        if (cached != null && cached !== "") {
          this._setRendered(key, cached);
          return true;
        }
      } catch (_) {}
      return false;
    }

    async _renderTemplateOnce(key, seq, raw, vars, sig) {
      if (!this.hass?.callWS) return;
      try {
        const res = await this.hass.callWS({
          type: "render_template",
          template: raw,
          variables: vars,
          strict: false,
        });
        if (this._tpl[key].seq !== seq) return;
        const text = res?.result == null ? "" : String(res.result);
        this._setRendered(key, text);
        this._storeTemplateCache(sig, text);
      } catch (err) {
        console.warn(`Template render failed for ${key}:`, err);
      }
    }

    async _subscribeTemplateImmediate(key, seq, raw, vars, sig) {
      if (!this.hass?.connection?.subscribeMessage) return;
      try {
        const unsub = await this.hass.connection.subscribeMessage(
          (msg) => this._onTemplateMsg(key, seq, sig, msg),
          { type: "render_template", template: raw, variables: vars, strict: false, report_errors: false }
        );
        const st = this._tpl[key];
        if (st.seq !== seq) { unsub?.(); return; }
        st.unsub = unsub;
      } catch (err) {
        console.warn(`Template subscription failed for ${key}:`, err);
        this._renderTemplateOnce(key, seq, raw, vars, sig);
      }
    }

    _onTemplateMsg(key, seq, sig, msg) {
      if (this._tpl[key].seq !== seq) return;
      if (msg?.error) { console.warn(`Template update error for ${key}:`, msg.error); return; }
      const text = msg?.result == null ? "" : String(msg.result);
      this._setRendered(key, text);
      this._storeTemplateCache(sig, text);
    }

    _storeTemplateCache(sig, value) {
      try { sessionStorage.setItem(sig, value); } catch (_) {}
    }

    _setRendered(key, value) {
      const v = value == null ? "" : String(value);
      if (key === "name") {
        this._renderedName = v;
      } else if (key === "state_label") {
        this._renderedState = v;
      } else if (key === "label") {
        this._renderedLabel = v;
      } else if (key === "info_display_override") {
        this._renderedInfo = v;
      }
      this.requestUpdate();
    }

    _unsubscribeTemplate(key) {
      const st = this._tpl[key];
      if (st?.unsub) {
        try { st.unsub(); } catch (_) {}
        st.unsub = null;
      }
    }

    disconnectedCallback() {
      super.disconnectedCallback();
      // Unsubscribe all templates
      if (this._tpl) {
        Object.keys(this._tpl).forEach(key => {
          if (key !== 'timer') {
            this._unsubscribeTemplate(key);
          }
        });
        if (this._tpl.timer) clearTimeout(this._tpl.timer);
      }
    }

    updated(changedProps) {
      // Setup templates when hass changes
      if (changedProps.has("hass") && this.hass) {
        this._scheduleTemplateSetup();
      }
      
      // Logic for popup updates
      if (changedProps.has("hass")) {
        // Popup updates
        if (this._popupOpen) {
          if (this._isDragging) return;
          
          const oldHass = changedProps.get("hass");
          const oldEntity = oldHass?.states[this._config.entity];
          const newEntity = this.hass?.states[this._config.entity];
          
          if (oldEntity && newEntity && 
              oldEntity.state === newEntity.state &&
              JSON.stringify(oldEntity.attributes) === JSON.stringify(newEntity.attributes)) {
            return;
          }
          
          const activeEl = this._popupPortal ? this._popupPortal.querySelector(':focus') : null;
          const isDropdownFocused = activeEl && activeEl.tagName === 'SELECT';

          if (!isDropdownFocused) {
          if (this._getDomain() === 'climate') {
            this._renderClimatePopupPortal(newEntity);
            return;
          }
          if (this._getDomain() === 'cover') {
            this._renderCoverPopupPortal(newEntity);
            return;
          }
          if (this._getDomain() === 'humidifier') {
            this._renderHumidifierPopupPortal(newEntity);
            return;
          }
          if (this._getDomain() === 'fan') {
            this._renderFanPopupPortal(newEntity);
            return;
          }
          if (this._getDomain() === 'switch') {
            this._renderSwitchPopupPortal(newEntity);
            return;
          }
          if (this._getDomain() === 'lock') {
            this._renderLockPopupPortal(newEntity);
            return;
          }

            this._syncState();
            this._updateHeaderIcon();
            
            if (this._activeView === 'brightness') {
              this._updateBrightnessDisplay();
            } else if (this._activeView === 'temperature') {
              this._updateTemperatureDisplay();
            } else if (this._activeView === 'color') {
              this._updateColorDisplay();
            }

            // If we're in the group member list view, re-render it so per-member
            // brightness/state updates reflect immediately.
            try {
              const viewType = this._popupPortal?.querySelector('[data-view-type]')?.dataset?.viewType;
              const entityIsGroup = Array.isArray(newEntity?.attributes?.entity_id) && newEntity.attributes.entity_id.length > 0;
              if (viewType === 'individual' && entityIsGroup) {
                const content = this._popupPortal?.querySelector('.hki-light-popup-content');
                if (content) {
                  content.innerHTML = this._renderIndividualView();
                  this._setupContentHandlers(this._popupPortal);
                }
              }
            } catch (e) {}
          }
        }
      }
    }

    /* --- HELPER METHODS --- */
    _getTempGradient() {
      return 'linear-gradient(to top, #00D9FF 0%, #00E5A0 25%, #DFFF00 50%, #FFB800 75%, #FF8C00 100%)';
    }

    _getTempStep() {
      const ent = this._getEntity();
      return this._config.climate_temp_step ?? ent?.attributes?.target_temp_step ?? 0.5;
    }

    _clampTemp(value) {
      return Math.max(this._tempMin, Math.min(this._tempMax, Math.round(value * 10) / 10));
    }

    _getTempPercentage(value) {
      return ((value - this._tempMin) / (this._tempMax - this._tempMin)) * 100;
    }

    _updateCircularSliderUI(portal, value, unit) {
      const percentage = this._getTempPercentage(value);
      const maxArcLength = 628.32 * 0.75;
      const arcLength = (percentage / 100) * maxArcLength;
      const startAngle = 135 * (Math.PI / 180);
      const arcAngle = (percentage / 100) * 270 * (Math.PI / 180);
      const totalAngle = startAngle + arcAngle;
      const thumbX = 140 + 100 * Math.cos(totalAngle);
      const thumbY = 140 + 100 * Math.sin(totalAngle);
      const valueSize = this._config.popup_value_font_size || 64;
      
      const progress = portal.querySelector('#circularProgress');
      const thumb = portal.querySelector('#circularThumb');
      const valueDisplay = portal.querySelector('#circularTempValue');
      
      if (progress) progress.setAttribute('stroke-dasharray', `${arcLength} 628.32`);
      if (thumb) {
        thumb.setAttribute('cx', thumbX);
        thumb.setAttribute('cy', thumbY);
      }
      if (valueDisplay) valueDisplay.innerHTML = `${value}<span style="font-size: ${valueSize / 2}px;">${unit}</span>`;
    }

    /* --- POPUP DISPLAY UPDATES --- */
    _updateBrightnessDisplay() {
      if (!this._popupPortal) return;
      const brightness = this._getBrightness();
      const fill = this._popupPortal.querySelector('.vertical-slider-fill');
      const thumb = this._popupPortal.querySelector('.vertical-slider-thumb');
      const valueDisplay = this._popupPortal.querySelector('.value-display');
      
      if (fill) {
        fill.style.height = brightness + '%';
        if (this._config.dynamic_bar_color) {
          const color = this._getCurrentColor();
          fill.style.background = color;
        }
      }
      if (thumb) thumb.style.bottom = 'calc(' + brightness + '% - 6px)';
      if (valueDisplay) valueDisplay.innerHTML = brightness + '<span>%</span>';
    }

    _updateTemperatureDisplay() {
      if (!this._popupPortal) return;
      const entity = this._getEntity();
      if (this._getDomain() === 'climate') { this._renderClimatePopupPortal(entity); return; }
      if (!entity || !entity.attributes.color_temp) return;
      
      const range = this._tempMax - this._tempMin;
      const currentTempPct = 100 - (((this._currentTemp - this._tempMin) / range) * 100);
      const kelvin = Math.round(1000000 / this._currentTemp);
      
      const fill = this._popupPortal.querySelector('.vertical-slider-fill');
      const thumb = this._popupPortal.querySelector('.vertical-slider-thumb');
      const valueDisplay = this._popupPortal.querySelector('.value-display');
      
      if (fill) fill.style.height = currentTempPct + '%';
      if (thumb) thumb.style.bottom = 'calc(' + currentTempPct + '% - 6px)';
      if (valueDisplay) valueDisplay.textContent = this._getTempName(kelvin);
    }

    _updateColorDisplay() {
      if (!this._popupPortal) return;
      const indicator = this._popupPortal.querySelector('#colorIndicator');
      if (!indicator) return;
      
      const colorWheel = this._popupPortal.querySelector('#colorWheel');
      if (!colorWheel) return;
      
      const rect = colorWheel.getBoundingClientRect();
      const r = rect.width / 2;
      
      const theta = (this._hue - 90) * (Math.PI / 180);
      const dist = (this._saturation / 100) * r;
      
      const x = r + (dist * Math.cos(theta));
      const y = r + (dist * Math.sin(theta));
      
      indicator.style.left = x + 'px';
      indicator.style.top = y + 'px';
      indicator.style.background = 'hsl(' + this._hue + ', ' + this._saturation + '%, 50%)';
      
      const colorNameEl = this._popupPortal.querySelector('.value-display');
      if (colorNameEl) {
        colorNameEl.textContent = this._getColorName(this._hue, this._saturation);
      }
    }

    _updateHeaderIcon() {
      if (!this._popupPortal) return;
      const headerIcon = this._popupPortal.querySelector('.hki-light-popup-title ha-icon');
      if (headerIcon) {
        headerIcon.style.color = this._getCurrentColor();
      }
      const stateEl = this._popupPortal.querySelector('.hki-light-popup-state');
      if (stateEl) {
        const isOn = this._isOn();
        const brightness = this._getBrightness();
        stateEl.textContent = isOn ? brightness + '%' : 'Off';
      }
    }

    disconnectedCallback() {
      super.disconnectedCallback();
      this._closePopup();
    }

    _getDomain() {
      return this._config.entity ? this._config.entity.split('.')[0] : 'light';
    }
    
    _syncClimateState() {
      const entity = this._getEntity();
      if (!entity) return;
      const attrs = entity.attributes;
      this._tempMin = attrs.min_temp || 7;
      this._tempMax = attrs.max_temp || 35;
      this._step = this._config.climate_temp_step ?? attrs.target_temp_step ?? 0.5;
    }
    
    _getEntity() {
      if (!this.hass || !this._config.entity) return null;
      return this.hass.states[this._config.entity];
    }

    _isOn() {
      const entity = this._getEntity();
      if (!entity) return false;
      if (this._getDomain() === 'climate') return entity.state !== 'off';
      if (this._getDomain() === 'cover') return entity.state !== 'closed';
      if (this._getDomain() === 'alarm_control_panel') return entity.state !== 'disarmed';
      return entity.state === "on";
    }

    _getBrightness() {
      const entity = this._getEntity();
      if (entity && entity.attributes.brightness) {
        return Math.round((entity.attributes.brightness / 255) * 100);
      }
      return this._isOn() ? 100 : 0;
    }

    async _renderTemplate(template) {
      if (!template || typeof template !== 'string') return template;
      // Check if it contains Jinja syntax
      if (!template.includes('{{') && !template.includes('{%')) return template;
      
      try {
        const result = await this.hass.callWS({
          type: 'render_template',
          template: template,
        });
        return result || template;
      } catch (err) {
        console.warn('Template rendering failed:', err);
        return template;
      }
    }

    _rgbToHs(r, g, b) {
        r /= 255; g /= 255; b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;
        if (max === min) {
            h = s = 0; 
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }
        return [h * 360, s * 100];
    }

    _stateColorToken(domain, state, isActive) {
      // Uses HA’s built-in state/domain color rules via theme variables
      // Fallback chain per HA docs:
      // state-{domain}-{state}-color -> state-{domain}-{active|inactive}-color -> state-{active|inactive}-color
      const a = isActive ? 'active' : 'inactive';
      return `var(--state-${domain}-${state}-color, var(--state-${domain}-${a}-color, var(--state-${a}-color, var(--primary-text-color))))`;
    }

    _getCurrentColor() {
      const entity = this._getEntity();
      if (!entity) return (this._config.icon_color || 'var(--primary-text-color)');
    
      const domain = this._getDomain();
      const isActive = this._isOn(); // important: uses your domain-aware logic
    
      // --- Alarm: custom colors per state ---
      if (domain === 'alarm_control_panel') {
        const s = entity.state;
    
        // green = disarmed
        if (s === 'disarmed') return '#4CAF50';
    
        // orange = pending/arming
        if (s === 'pending' || s === 'arming') return '#FF9800';
    
        // red = armed (and triggered)
        if (s.startsWith('armed_') || s === 'triggered') return '#F44336';
    
        // fallback to HA token if some other state appears
        return this._stateColorToken(domain, s, isActive);
      }
    
      // --- Lights: keep your existing "actual light color" logic when active ---
      if (domain === 'light') {
        if (!isActive) return (this._config.icon_color || 'var(--primary-text-color)');
    
        const attrs = entity.attributes || {};
        if (attrs.rgb_color) return `rgb(${attrs.rgb_color.join(',')})`;
        if (attrs.hs_color) return `hsl(${attrs.hs_color[0]}, ${attrs.hs_color[1]}%, 50%)`;
        if (attrs.color_temp) {
          if (attrs.color_temp > 400) return '#FFD700';
          if (attrs.color_temp < 200) return '#E8F0FF';
          return '#FFF5E6';
        }
        return this._config.icon_color_on || '#FFD700';
      }
    
      // --- Climate: keep your HVAC palette when active (as you already do elsewhere) ---
      if (domain === 'climate') {
        if (!isActive) return (this._config.icon_color || 'var(--primary-text-color)');
        return (HVAC_COLORS?.[entity.state] || this._stateColorToken(domain, entity.state, true));
      }
    
      // --- Everything else (covers included): default to HA's built-in domain/state colors ---
      // If you prefer a single fallback "on" color, set icon_color_on in config; otherwise this uses theme rules.
      if (!isActive) return (this._config.icon_color || 'var(--primary-text-color)');
      return (this._config.icon_color_on || this._stateColorToken(domain, entity.state, true));
    }


    // Same as _getCurrentColor but for any given state object (e.g. group members)
    _getCurrentColorFromState(stateObj) {
      if (!stateObj || stateObj.state !== 'on') return null;
      const attrs = stateObj.attributes || {};
      if (Array.isArray(attrs.rgb_color)) return `rgb(${attrs.rgb_color.join(',')})`;
      if (Array.isArray(attrs.hs_color)) return `hsl(${attrs.hs_color[0]}, ${attrs.hs_color[1]}%, 50%)`;
      if (typeof attrs.color_temp === 'number') {
        // crude warm/cool approximation like the main icon
        if (attrs.color_temp > 400) return '#FFD700';
        if (attrs.color_temp < 200) return '#E8F0FF';
        return '#FFF5E6';
      }
      return '#FFD700';
    }

    _getEffectivePopupTimeFormat() {
      const opt = (this._config.popup_time_format || 'auto');
      if (opt === '12') return '12';
      if (opt === '24') return '24';

      const tf = this.hass?.locale?.time_format; // Home Assistant: 'am_pm' | '24' | 'language'
      if (tf === 'am_pm') return '12';
      if (tf === '24') return '24';
      return 'auto';
    }

    _formatHistoryTime(date) {
      const mode = this._getEffectivePopupTimeFormat();
      const base = { hour: '2-digit', minute: '2-digit' };
      if (mode === '12') return date.toLocaleTimeString([], { ...base, hour12: true });
      if (mode === '24') return date.toLocaleTimeString([], { ...base, hour12: false });
      return date.toLocaleTimeString([], base);
    }

    _syncState() {
      const entity = this._getEntity();
      if (!entity) return;
      const attrs = entity.attributes;

      if (attrs.min_mireds) this._tempMin = attrs.min_mireds;
      if (attrs.max_mireds) this._tempMax = attrs.max_mireds;
      if (attrs.color_temp) this._currentTemp = attrs.color_temp;
      
      if (attrs.hs_color && attrs.hs_color.length === 2) {
          this._hue = attrs.hs_color[0];
          this._saturation = attrs.hs_color[1];
      } else if (attrs.rgb_color && attrs.rgb_color.length === 3) {
          const [h, s] = this._rgbToHs(...attrs.rgb_color);
          this._hue = h;
          this._saturation = s;
      } else if (entity.state === 'on') {
          if (this._hue === 0 && this._saturation === 0) {
              this._hue = 30;
              this._saturation = 20;
          }
      }

      // Clear optimistic climate UI state once Home Assistant confirms it
      if (entity && entity.entity_id && entity.entity_id.startsWith('climate.')) {
        if (this._optimisticHvacMode != null && entity.state === this._optimisticHvacMode) {
          this._optimisticHvacMode = undefined;
        }
        const t = attrs.temperature;
        if (this._optimisticClimateTemp != null && typeof t === 'number' && Math.abs(t - this._optimisticClimateTemp) < 0.001) {
          this._optimisticClimateTemp = undefined;
        }
      }

    }

    /* --- ACTION HANDLING --- */
    _startHold(e, actionConfig) {
        // Prevent hold-action from firing while the user is scrolling.
        // We cancel the hold if the pointer moves beyond a small threshold.
        const start = (e.touches && e.touches[0]) ? e.touches[0] : e;
        this._holdStartX = start.clientX;
        this._holdStartY = start.clientY;
        this._holdMoved = false;

        // Clear any previous listeners
        if (this._holdMoveListener) {
          window.removeEventListener('mousemove', this._holdMoveListener);
          window.removeEventListener('touchmove', this._holdMoveListener);
        }
        if (this._holdEndListener) {
          window.removeEventListener('mouseup', this._holdEndListener);
          window.removeEventListener('touchend', this._holdEndListener);
          window.removeEventListener('touchcancel', this._holdEndListener);
        }

        this._holdMoveListener = (ev) => {
          const p = (ev.touches && ev.touches[0]) ? ev.touches[0] : ev;
          const dx = Math.abs(p.clientX - this._holdStartX);
          const dy = Math.abs(p.clientY - this._holdStartY);
          if (dx > 10 || dy > 10) {
            this._holdMoved = true;
            this._clearHold();
          }
        };
        this._holdEndListener = () => {
          this._clearHold();
          if (this._holdMoveListener) {
            window.removeEventListener('mousemove', this._holdMoveListener);
            window.removeEventListener('touchmove', this._holdMoveListener);
          }
          if (this._holdEndListener) {
            window.removeEventListener('mouseup', this._holdEndListener);
            window.removeEventListener('touchend', this._holdEndListener);
            window.removeEventListener('touchcancel', this._holdEndListener);
          }
        };
        window.addEventListener('mousemove', this._holdMoveListener, { passive: true });
        window.addEventListener('touchmove', this._holdMoveListener, { passive: true });
        window.addEventListener('mouseup', this._holdEndListener, { passive: true });
        window.addEventListener('touchend', this._holdEndListener, { passive: true });
        window.addEventListener('touchcancel', this._holdEndListener, { passive: true });

        this._holdTimer = setTimeout(() => {
            if (this._holdMoved) return;
            this._handleAction(actionConfig);
            this._holdFired = true;
        }, 500); // 500ms hold threshold
        this._holdFired = false;
    }

    _clearHold() {
        clearTimeout(this._holdTimer);
        this._holdFired = false;
    }

    _inEditorPreview() {
      // Check if we're inside the card editor's preview area
      // Editor preview has specific parent elements we can detect
      let el = this;
      while (el) {
        if (el.classList && (el.classList.contains('element-preview') || el.classList.contains('card-config'))) {
          return true;
        }
        el = el.parentElement || el.getRootNode()?.host;
      }
      return false;
    }

    _handleDelayClick(tapAction, doubleTapAction) {
      // If no double tap action is configured (or set to none), fire immediately to keep it snappy
      if (!doubleTapAction || doubleTapAction.action === 'none') {
        this._handleAction(tapAction);
        return;
      }

      // If a timer is running, this is the 2nd click of a double tap sequence.
      // We clear the timer to prevent the SINGLE tap action from firing.
      // The browser's native @dblclick listener will handle the actual double tap action.
      if (this._tapTimer) {
        clearTimeout(this._tapTimer);
        this._tapTimer = null;
      } else {
        // This is the first click. specific delay to wait for a potential second click.
        this._tapTimer = setTimeout(() => {
          this._handleAction(tapAction);
          this._tapTimer = null;
        }, 250);
      }
    }

    _handleAction(actionConfig) {
      if (!actionConfig || !actionConfig.action) return;
    
      // Prevent actions from running in editor preview mode
      if (this._inEditorPreview()) return;
    
      // HKI specific - custom popup
      if (actionConfig.action === "hki-more-info") {
        this._openPopup();
        return;
      }
    
      // Handle toggle action directly
      if (actionConfig.action === "toggle") {
        const domain = this._getDomain ? this._getDomain() : undefined;
        const entityId = this._config.entity;
    
        // Climate: toggle OFF <-> last used HVAC mode
        if (domain === "climate") {
          const ent = this._getEntity && this._getEntity();
          const current = ent && ent.state;
          const key = `hki_climate_last_mode:${entityId}`;
    
          // If currently in a mode (not off): remember and turn off
          if (current && current !== "off") {
            try {
              localStorage.setItem(key, current);
            } catch (e) {}
            this.hass.callService("climate", "set_hvac_mode", {
              entity_id: entityId,
              hvac_mode: "off",
            });
            return;
          }
    
          // If currently off: restore last mode or fall back to first non-off hvac_mode
          let last = null;
          try {
            last = localStorage.getItem(key);
          } catch (e) {}
          const hvacModes =
            ent && ent.attributes && ent.attributes.hvac_modes
              ? ent.attributes.hvac_modes
              : [];
          const fallback =
            (Array.isArray(hvacModes)
              ? hvacModes.find((m) => m && m !== "off")
              : null) || "heat";
    
          this.hass.callService("climate", "set_hvac_mode", {
            entity_id: entityId,
            hvac_mode: last || fallback,
          });
          return;
        }
    
        // All other domains: HA generic toggle
        this.hass.callService("homeassistant", "toggle", { entity_id: entityId });
        return;
      }
    
      // ✅ NEW: Execute call-service directly (header-card style)
      // Expected shape:
      // { action: "call-service", service: "light.turn_on", service_data: {...} }
      if (actionConfig.action === "call-service" && actionConfig.service) {
        const [domain, service] = String(actionConfig.service).split(".");
        if (domain && service) {
          this.hass.callService(domain, service, actionConfig.service_data || {});
        }
        return;
      }
    
      // ✅ NEW: Execute perform-action directly (treat like a service call)
      // Expected shape:
      // { action: "perform-action", perform_action: "light.turn_on", data: {...}, target: {...} }
      if (actionConfig.action === "perform-action" && actionConfig.perform_action) {
        const [domain, service] = String(actionConfig.perform_action).split(".");
        if (domain && service) {
          const data = actionConfig.data || {};
          const target = actionConfig.target;
    
          // Some HA builds accept target as a 4th arg. If not, merge entity_id into data.
          try {
            this.hass.callService(domain, service, data, target);
          } catch (e) {
            const merged =
              target?.entity_id ? { ...data, entity_id: target.entity_id } : data;
            this.hass.callService(domain, service, merged);
          }
        }
        return;
      }
    
      // For all other actions (more-info, navigate, url, etc.)
      // ✅ Fire the standard Home Assistant action event properly
      this.dispatchEvent(
        new CustomEvent("hass-action", {
          bubbles: true,
          composed: true,
          detail: {
            config: actionConfig,
            action: actionConfig.action,
          },
        })
      );
    }

    _openPopup() {
      if (this._popupOpen) return;
      
      const domain = this._getDomain();
      const entity = this._getEntity();
      
      // Check if we have HKI popup support for this domain
      const supportedDomains = ['light', 'climate', 'alarm_control_panel', 'cover', 'humidifier', 'fan', 'switch', 'lock'];
      if (!supportedDomains.includes(domain)) {
        // Fall back to native more-info for unsupported domains
        const event = new Event('hass-more-info', { bubbles: true, composed: true });
        event.detail = { entityId: this._config.entity };
        this.dispatchEvent(event);
        return;
      }
      
      this._popupOpen = true;
      __hkiLockScroll();

      if (domain === 'climate') {
        // Climate default view = Heat (sliders)
        this._activeView = 'main';
        this._syncClimateState();
        this._renderClimatePopupPortal(entity);
        return;
      }

      if (domain === 'alarm_control_panel') {
        this._alarmHistoryOpen = false;
        this._alarmCodeInput = '';
        this._renderAlarmPopupPortal(entity);
        return;
      }

      if (domain === 'cover') {
        // Cover default view
        this._activeView = 'controls';
        this._coverEditMode = false;
        this._coverGroupMode = false;
        this._ensureCoverFavorites();
        this._renderCoverPopupPortal(entity);
        return;
      }

      if (domain === 'humidifier') {
        this._activeView = 'main';
        this._renderHumidifierPopupPortal(entity);
        return;
      }

      if (domain === 'switch') {
        this._activeView = 'main';
        this._renderSwitchPopupPortal(entity);
        return;
      }

      if (domain === 'lock') {
        this._activeView = 'main';
        this._renderLockPopupPortal(entity);
        return;
      }

      // Light default view
      this._activeView = 'brightness';
      this._brightness = this._getBrightness();
      this._expandedEffects = false;
      this._syncState();

      // Favorites
      this._favoritesEditMode = false;
      this._ensureLightFavorites();

      this._renderPopupPortal();
    }

    _closePopup() {
      this._popupOpen = false;
      this._isDragging = false;
      this._expandedEffects = false;
      if (this._popupPortal) {
        this._popupPortal.remove();
        this._popupPortal = null;
      }
      __hkiUnlockScroll();
    }

    _getColorName(hue, saturation) {
      if (saturation < 5) return 'White';
      if (saturation < 15) return 'Light Gray';
      if (saturation < 25) return 'Pale ' + this._getHueName(hue);
      if (saturation < 40) return 'Light ' + this._getHueName(hue);
      if (saturation > 90) return 'Vivid ' + this._getHueName(hue);
      if (saturation > 75) return 'Bright ' + this._getHueName(hue);
      return this._getHueName(hue);
    }

    _getHueName(hue) {
      if (hue >= 0 && hue < 10) return 'Red';
      if (hue >= 10 && hue < 20) return 'Scarlet';
      if (hue >= 20 && hue < 35) return 'Orange Red';
      if (hue >= 35 && hue < 50) return 'Orange';
      if (hue >= 50 && hue < 60) return 'Gold';
      if (hue >= 60 && hue < 70) return 'Yellow';
      if (hue >= 70 && hue < 80) return 'Yellow Green';
      if (hue >= 80 && hue < 100) return 'Chartreuse';
      if (hue >= 100 && hue < 130) return 'Green';
      if (hue >= 130 && hue < 150) return 'Spring Green';
      if (hue >= 150 && hue < 170) return 'Cyan';
      if (hue >= 170 && hue < 190) return 'Turquoise';
      if (hue >= 190 && hue < 210) return 'Sky Blue';
      if (hue >= 210 && hue < 230) return 'Azure';
      if (hue >= 230 && hue < 250) return 'Blue';
      if (hue >= 250 && hue < 270) return 'Indigo';
      if (hue >= 270 && hue < 290) return 'Purple';
      if (hue >= 290 && hue < 310) return 'Violet';
      if (hue >= 310 && hue < 330) return 'Magenta';
      if (hue >= 330 && hue < 345) return 'Pink';
      if (hue >= 345) return 'Rose';
      return 'Red';
    }

    _getTempName(kelvin) {
      if (kelvin < 2000) return 'Candle';
      if (kelvin < 2500) return 'Very Warm';
      if (kelvin < 2900) return 'Warm White';
      if (kelvin < 3500) return 'Soft White';
      if (kelvin < 4500) return 'Neutral';
      if (kelvin < 5500) return 'Cool White';
      if (kelvin < 6500) return 'Daylight';
      return 'Cool Daylight';
    }

    _ensureLightFavorites() {
      try {
        const entityId = this._config?.entity;
        if (!entityId) return;
        if (Array.isArray(this._lightFavorites) && this._lightFavorites._for === entityId) return;

        const raw = localStorage.getItem(__hkiFavKey(entityId));
        let favs = null;
        if (raw) {
          try { favs = JSON.parse(raw); } catch (e) { favs = null; }
        }
        if (!Array.isArray(favs) || favs.length === 0) {
          favs = __hkiSeedFavorites();
          localStorage.setItem(__hkiFavKey(entityId), JSON.stringify(favs));
        }
        favs._for = entityId;
        this._lightFavorites = favs;
      } catch (e) {
        // fallback to seeded list in-memory
        const favs = __hkiSeedFavorites();
        favs._for = this._config?.entity;
        this._lightFavorites = favs;
      }
    }

    _saveLightFavorites() {
      try {
        const entityId = this._config?.entity;
        if (!entityId || !Array.isArray(this._lightFavorites)) return;
        const toSave = this._lightFavorites.filter(f => f && typeof f === 'object' && f.id);
        localStorage.setItem(__hkiFavKey(entityId), JSON.stringify(toSave));
        toSave._for = entityId;
        this._lightFavorites = toSave;
      } catch (e) {}
    }

    _formatAttrLabel(attrKey) {
      if (!attrKey) return '';
      return String(attrKey)
        .replace(/_/g, ' ')
        .split(' ')
        .filter(Boolean)
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
    }


    _ensurePopupDialogStyles() {
      if (document.getElementById('hki-dialog-styles')) return;
      const st = document.createElement('style');
      st.id = 'hki-dialog-styles';
      st.textContent = `
        .hki-dialog-backdrop{position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:10001;display:flex;align-items:center;justify-content:center;}
        .hki-dialog{width:92%;max-width:360px;background:var(--card-background-color,#1c1c1c);border-radius:16px;box-shadow:0 10px 38px rgba(0,0,0,0.45);overflow:hidden;border:1px solid var(--divider-color, rgba(255,255,255,0.06));}
        .hki-dialog-h{padding:14px 16px;font-weight:600;font-size:14px;color:var(--primary-text-color);border-bottom:1px solid var(--divider-color, rgba(255,255,255,0.06));}
        .hki-dialog-b{padding:14px 16px;display:flex;flex-direction:column;gap:10px;}
        .hki-dialog-b p{margin:0;color:var(--primary-text-color);opacity:0.8;font-size:13px;line-height:1.3;}
        .hki-dialog-in{width:100%;box-sizing:border-box;background:var(--secondary-background-color, rgba(255,255,255,0.06));border:1px solid var(--divider-color, rgba(255,255,255,0.10));border-radius:12px;color:var(--primary-text-color);padding:10px 12px;font-size:14px;outline:none;}
        .hki-dialog-f{padding:12px 16px;display:flex;gap:10px;justify-content:flex-end;border-top:1px solid var(--divider-color, rgba(255,255,255,0.06));}
        .hki-dialog-btn{height:34px;padding:0 14px;border-radius:999px;border:1px solid var(--divider-color, rgba(255,255,255,0.12));background:var(--secondary-background-color, rgba(255,255,255,0.06));color:var(--primary-text-color);cursor:pointer;}
        .hki-dialog-btn.primary{background:var(--primary-color, rgba(255,255,255,0.14));color:var(--text-primary-color, var(--primary-text-color));}
      `;
      document.head.appendChild(st);
    }

    _promptText(title, defaultValue = '', opts = {}) {
      this._ensurePopupDialogStyles();
      const { message = '', okText = 'OK', cancelText = 'Skip', placeholder = '' } = opts;
      return new Promise((resolve) => {
        const bd = document.createElement('div');
        bd.className = 'hki-dialog-backdrop';
        bd.innerHTML = `
          <div class="hki-dialog" role="dialog" aria-modal="true">
            <div class="hki-dialog-h">${title}</div>
            <div class="hki-dialog-b">
              ${message ? `<p>${message}</p>` : ''}
              <input class="hki-dialog-in" id="hkiDlgIn" placeholder="${placeholder}" />
            </div>
            <div class="hki-dialog-f">
              <button class="hki-dialog-btn" id="hkiDlgCancel">${cancelText}</button>
              <button class="hki-dialog-btn primary" id="hkiDlgOk">${okText}</button>
            </div>
          </div>`;
        document.body.appendChild(bd);
        const input = bd.querySelector('#hkiDlgIn');
        if (input) {
          input.value = String(defaultValue ?? '');
          setTimeout(() => input.focus(), 0);
          input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') bd.querySelector('#hkiDlgOk')?.click();
            if (e.key === 'Escape') bd.querySelector('#hkiDlgCancel')?.click();
          });
        }
        const cleanup = (val) => {
          bd.remove();
          resolve(val);
        };
        // Clicking outside the dialog is a true cancel (return null)
        bd.addEventListener('click', (e) => { if (e.target === bd) cleanup(null); });
        // "Skip" should not cancel the operation; it means "use empty/default"
        bd.querySelector('#hkiDlgCancel')?.addEventListener('click', () => cleanup(''));
        bd.querySelector('#hkiDlgOk')?.addEventListener('click', () => cleanup(input ? input.value : ''));
      });
    }

    _promptYesNo(title, message, opts = {}) {
      this._ensurePopupDialogStyles();
      const { yesText = 'Yes', noText = 'Skip' } = opts;
      return new Promise((resolve) => {
        const bd = document.createElement('div');
        bd.className = 'hki-dialog-backdrop';
        bd.innerHTML = `
          <div class="hki-dialog" role="dialog" aria-modal="true">
            <div class="hki-dialog-h">${title}</div>
            <div class="hki-dialog-b"><p>${message}</p></div>
            <div class="hki-dialog-f">
              <button class="hki-dialog-btn" id="hkiDlgNo">${noText}</button>
              <button class="hki-dialog-btn primary" id="hkiDlgYes">${yesText}</button>
            </div>
          </div>`;
        document.body.appendChild(bd);
        const cleanup = (val) => { bd.remove(); resolve(val); };
        bd.addEventListener('click', (e) => { if (e.target === bd) cleanup(false); });
        bd.querySelector('#hkiDlgNo')?.addEventListener('click', () => cleanup(false));
        bd.querySelector('#hkiDlgYes')?.addEventListener('click', () => cleanup(true));
      });
    }

    _renderFavoritesView() {
      this._ensureLightFavorites();
      const favs = Array.isArray(this._lightFavorites) ? this._lightFavorites : [];
      // Note: edit button is rendered in a sticky header so it never scrolls with the grid.
      let html = `
        <div class="favorites-view" data-view-type="scenes">
          <div class="favorites-sticky-header">
            <button class="favorites-edit-btn" id="favoritesEditBtn">
              <ha-icon icon="${this._favoritesEditMode ? 'mdi:check' : 'mdi:pencil'}"></ha-icon>
              <span>${this._favoritesEditMode ? 'Done' : 'Edit'}</span>
            </button>
          </div>
          <div class="presets-container favorites-grid">
      `;

      favs.forEach((fav, idx) => {
        const color = fav.color || (fav.rgb_color ? `rgb(${fav.rgb_color.join(',')})` : '#888');
        const picture = fav.picture ? String(fav.picture) : '';
        html += `
          <button class="preset-btn" data-fav-index="${idx}">
            ${picture
              ? `<img class="preset-picture" src="${picture}" />`
              : `<div class="preset-color" style="background: ${color}"></div>`
            }
            <span class="preset-name">${fav.name || 'Favorite'}</span>
            ${this._favoritesEditMode ? `<span class="fav-delete-badge" data-fav-del="${idx}"><ha-icon icon="mdi:close"></ha-icon></span>` : ''}
          </button>
        `;
      });

      html += `</div></div>`;
      return html;
    }

    async _addCurrentLightToFavorites() {
      this._ensureLightFavorites();
      const entity = this._getEntity();
      if (!entity) return;
      const attrs = entity.attributes || {};

      // Default name: use color names (Warm White, Indigo, etc.) when applicable.
      const defaultName = (this._activeView === 'temperature')
        ? this._getTempName(Math.round(1000000 / (this._currentTemp || attrs.color_temp || 326)))
        : (this._activeView === 'color')
          ? this._getColorName(this._hue, this._saturation)
          : (this._config.name || attrs.friendly_name || 'Favorite');

      // Ask for a friendly name (optional). 'Skip' keeps the default name.
      const nameInput = await this._promptText('Favorite name', defaultName, {
        okText: 'Save',
        cancelText: 'Skip',
        placeholder: 'Optional'
      });
      const finalName = (nameInput === null) ? defaultName : (String(nameInput).trim() || defaultName);

      // Group entities: saving from the wheel/temp tabs should create a normal favorite
      // applied to the group entity (since the picker already sets all members).

      // Single light favorites: never prompt here; use the default color name.
      const fav = {
        id: `fav_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
        name: finalName,
      };

      // Capture brightness/effect
      if (typeof attrs.brightness === 'number') fav.brightness = attrs.brightness;
      if (attrs.effect) fav.effect = attrs.effect;

      // IMPORTANT: Save only ONE color descriptor based on the current view
      if (this._activeView === 'temperature') {
        const ct = (typeof this._currentTemp === 'number' ? this._currentTemp : attrs.color_temp);
        if (typeof ct === 'number' && !Number.isNaN(ct)) {
          fav.type = 'temp';
          fav.color_temp = ct;
          fav.kelvin = Math.round(1000000 / ct);
          fav.color = (fav.kelvin < 3500) ? '#FFE4B5' : (fav.kelvin < 5000 ? '#FFF5E6' : '#E8F0FF');
        }
      } else if (this._activeView === 'color') {
        const h = (typeof this._hue === 'number' ? this._hue : (Array.isArray(attrs.hs_color) ? attrs.hs_color[0] : 0));
        const sat = (typeof this._saturation === 'number' ? this._saturation : (Array.isArray(attrs.hs_color) ? attrs.hs_color[1] : 100));
        const rgb = _hsvToRgb(h, sat, 100);
        fav.type = 'rgb';
        fav.rgb_color = rgb;
        fav.color = `rgb(${rgb.join(',')})`;
      }

      if (!Array.isArray(this._lightFavorites)) this._lightFavorites = [];
      this._lightFavorites.unshift(fav);
      this._saveLightFavorites();
    }

    async _addGroupSnapshotToFavorites(opts = {}) {
      this._ensureLightFavorites();
      const entity = this._getEntity();
      if (!entity) return;
      const attrs = entity.attributes || {};
      const members = Array.isArray(attrs.entity_id) ? attrs.entity_id.slice() : [];
      if (members.length === 0) return;

      const defaultName = (opts.name || this._config.name || attrs.friendly_name || 'Group Scene');

      // Only the group list should ask for a custom name.
      // Saving from the color wheel / temperature views should auto-name (color name) and never prompt.
      let name = defaultName;
      if (!opts.skipPrompt) {
        const nameInput = await this._promptText('Favorite name', defaultName, {
          message: 'This will save the current state of each group member.',
          okText: 'Save',
          cancelText: 'Skip'
        });
        if (nameInput === null) return;
        name = String(nameInput).trim() || defaultName;
      }

      // Snapshot member states
      const states = {};
      const colors = [];
      const temps = [];

      for (const eid of members) {
        const st = this.hass?.states?.[eid];
        if (!st) continue;
        const a = st.attributes || {};
        const snap = { state: st.state };
        if (typeof a.brightness === 'number') snap.brightness = a.brightness;
        if (a.effect) snap.effect = a.effect;

        // If this popup is controlling a group, each row can be in a different mode.
        // When saving a group favorite, respect the visible slider mode per member:
        // - temp slider => save temp
        // - color slider => save color
        // - brightness slider => don't force a color descriptor
        const memberMode = opts.pickerMode || this._groupMemberModes?.[eid] || 'brightness';
        if (memberMode === 'temp') {
          if (typeof a.color_temp === 'number') {
            snap.type = 'temp';
            snap.color_temp = a.color_temp;
          }
        } else if (memberMode === 'color') {
          if (Array.isArray(a.rgb_color)) {
            snap.type = 'rgb';
            snap.rgb_color = a.rgb_color;
          } else if (Array.isArray(a.hs_color)) {
            snap.type = 'hs';
            snap.hs_color = a.hs_color;
          }
        } else {
          // brightness view: keep whatever HA reports, but don't try to mix descriptors
          // (avoids "Color descriptors" conflict)
        }
        states[eid] = snap;
      }

      // Determine swatch color if consistent, otherwise ask for custom color/picture
      let picture = '';
      let swatch = (opts.forceSwatch ? String(opts.forceSwatch).trim() : '');
      try {
        // compute if all members share same rgb_color
        const rgbs = [];
        for (const eid of Object.keys(states)) {
          const s = states[eid];
          if (s.type === 'rgb' && Array.isArray(s.rgb_color)) rgbs.push(s.rgb_color.join(','));
          else rgbs.push('');
        }
      } catch (e) {}

      // We'll do JS-side uniqueness below
      const rgbKeys = Object.values(states).map(s => (s.type === 'rgb' && Array.isArray(s.rgb_color)) ? s.rgb_color.join(',') : '');
      const uniqRgb = Array.from(new Set(rgbKeys.filter(Boolean)));
      if (uniqRgb.length === 1) {
        swatch = `rgb(${uniqRgb[0]})`;
      }

      if (!opts.nameOnly && (opts.alwaysPromptMeta || !swatch)) {
        const colorInput = await this._promptText('Optional button color', '', { message: 'Optional: enter a hex/rgb color for the favorite button (e.g. #ff00aa).', okText: 'Use', cancelText: 'Skip' });
        if (colorInput) swatch = String(colorInput).trim();

        const picInput = await this._promptText('Optional picture path', '', { message: 'Optional: enter an image path/URL (e.g. /local/favs/scene.png).', okText: 'Use', cancelText: 'Skip' });
        if (picInput) picture = String(picInput).trim();
      }

      const fav = {
        id: `fav_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
        name,
        type: 'scene',
        targets: members,
        states,
        ...(swatch ? { color: swatch } : {}),
        ...(picture ? { picture } : {}),
      };

      if (!Array.isArray(this._lightFavorites)) this._lightFavorites = [];
      this._lightFavorites.unshift(fav);
      this._saveLightFavorites();
    }



    _applyFavorite(fav) {
      if (!fav) return;

      // Group scene favorite: apply per-target snapshots
      if (fav.type === 'scene' && Array.isArray(fav.targets) && fav.states && this.hass) {
        for (const eid of fav.targets) {
          const snap = fav.states[eid];
          if (!snap) continue;
          if (snap.state === 'off') {
            this.hass.callService('light', 'turn_off', { entity_id: eid });
            continue;
          }
          const d = { entity_id: eid };
          if (typeof snap.brightness === 'number') d.brightness = snap.brightness;
          if (snap.effect) d.effect = snap.effect;
          if (snap.type === 'temp') {
            if (typeof snap.kelvin === 'number') d.kelvin = snap.kelvin;
            else if (typeof snap.color_temp === 'number') d.color_temp = snap.color_temp;
          } else if (snap.type === 'rgb') {
            if (Array.isArray(snap.rgb_color)) d.rgb_color = snap.rgb_color;
          } else if (snap.type === 'hs') {
            if (Array.isArray(snap.hs_color)) d.hs_color = snap.hs_color;
          }
          this.hass.callService('light', 'turn_on', d);
        }
        return;
      }
      const data = { entity_id: this._config.entity };

      // Common fields
      if (typeof fav.brightness === 'number') data.brightness = fav.brightness;
      if (fav.effect) data.effect = fav.effect;

      // IMPORTANT: only one color descriptor per service call
      if (fav.type === 'temp') {
        if (typeof fav.kelvin === 'number' && !Number.isNaN(fav.kelvin)) {
          data.kelvin = fav.kelvin;
        } else if (typeof fav.color_temp === 'number' && !Number.isNaN(fav.color_temp)) {
          data.color_temp = fav.color_temp;
        }
      } else if (fav.type === 'rgb') {
        if (Array.isArray(fav.rgb_color)) data.rgb_color = fav.rgb_color;
      } else if (fav.type === 'hs') {
        if (Array.isArray(fav.hs_color)) data.hs_color = fav.hs_color;
      } else {
        // Backward compatibility for older saved favorites
        if (Array.isArray(fav.rgb_color)) data.rgb_color = fav.rgb_color;
        else if (Array.isArray(fav.hs_color)) data.hs_color = fav.hs_color;
        else if (typeof fav.kelvin === 'number') data.kelvin = fav.kelvin;
        else if (typeof fav.color_temp === 'number') data.color_temp = fav.color_temp;
      }

      this.hass.callService('light', 'turn_on', data);
    }



    _getPopupButtonStyle(isActive = false) {
      if (isActive) {
        // Highlighted button styles
        const styles = [];
        if (this._config.popup_highlight_color) styles.push(`background: ${this._config.popup_highlight_color}`);
        if (this._config.popup_highlight_text_color) styles.push(`color: ${this._config.popup_highlight_text_color}`);
        if (this._config.popup_highlight_radius !== undefined && this._config.popup_highlight_radius !== null && this._config.popup_highlight_radius !== '') styles.push(`border-radius: ${this._config.popup_highlight_radius}px`);
        if (this._config.popup_highlight_opacity !== undefined && this._config.popup_highlight_opacity !== null && this._config.popup_highlight_opacity !== '') styles.push(`opacity: ${this._config.popup_highlight_opacity}`);
        
        // Use configured shadow or default shadow
        const shadow = this._config.popup_highlight_box_shadow || '0 2px 8px rgba(0,0,0,0.15), inset 0 1px 0 0 rgba(255,255,255,0.1)';
        styles.push(`box-shadow: ${shadow}`);
        
        const borderStyle = this._config.popup_highlight_border_style || 'none';
        const borderWidth = this._config.popup_highlight_border_width || '0';
        const borderColor = this._config.popup_highlight_border_color || 'transparent';
        if (borderStyle !== 'none') styles.push(`border: ${borderWidth}px ${borderStyle} ${borderColor}`);
        
        return styles.length ? styles.join('; ') + ';' : '';
      } else {
        // Non-highlighted button styles
        const styles = [];
        if (this._config.popup_button_bg) styles.push(`background: ${this._config.popup_button_bg}`);
        if (this._config.popup_button_text_color) styles.push(`color: ${this._config.popup_button_text_color}`);
        if (this._config.popup_button_radius !== undefined && this._config.popup_button_radius !== null && this._config.popup_button_radius !== '') styles.push(`border-radius: ${this._config.popup_button_radius}px`);
        if (this._config.popup_button_opacity !== undefined && this._config.popup_button_opacity !== null && this._config.popup_button_opacity !== '') styles.push(`opacity: ${this._config.popup_button_opacity}`);
        
        const borderStyle = this._config.popup_button_border_style || 'none';
        const borderWidth = this._config.popup_button_border_width || '0';
        const borderColor = this._config.popup_button_border_color || 'transparent';
        if (borderStyle !== 'none') styles.push(`border: ${borderWidth}px ${borderStyle} ${borderColor}`);
        
        return styles.length ? styles.join('; ') + ';' : '';
      }
    }


    _renderPopupPortal() {
      if (this._popupPortal) {
        this._popupPortal.remove();
      }

      const entity = this._getEntity();
      const entityName = this._config.name || (entity ? entity.attributes.friendly_name : '') || this._config.entity;
      const isOn = this._isOn();
      const brightness = this._getBrightness();
      const supportsColor = entity && entity.attributes.supported_color_modes && 
        entity.attributes.supported_color_modes.some(m => ['hs', 'rgb', 'xy', 'rgbw'].includes(m));
      const supportsTemp = entity && entity.attributes.supported_color_modes && 
        entity.attributes.supported_color_modes.some(m => m === 'color_temp');
      
      const effectList = entity && entity.attributes.effect_list ? entity.attributes.effect_list : [];
      const currentEffect = entity && entity.attributes.effect ? entity.attributes.effect : 'None';

      const isGroup = entity && entity.attributes.entity_id && Array.isArray(entity.attributes.entity_id);

      // Use coalescing for border radius so 0 is valid
      const borderRadius = this._config.popup_slider_radius ?? 12;
      
      const portal = document.createElement('div');
      portal.className = 'hki-light-popup-portal';

      portal.innerHTML = `
        <style>
          .hki-light-popup-portal {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
            background: rgba(0, 0, 0, 0.7); 
            display: flex; align-items: center; justify-content: center; z-index: 9999;
          }
          .hki-light-popup-container {
            background: var(--card-background-color, #1c1c1c); 
            border-radius: 16px; 
            width: 90%; max-width: 400px; height: 600px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
            display: flex; flex-direction: column;
            overflow: hidden;
          }
          .hki-light-popup-header {
            display: flex; justify-content: space-between; align-items: center; 
            padding: 16px 20px;
            background: rgba(255, 255, 255, 0.03);
            border-bottom: 1px solid var(--divider-color, rgba(255, 255, 255, 0.05));
            flex-shrink: 0;
          }
          .hki-light-popup-title {
            display: flex; align-items: center; gap: 12px; flex: 1;
          }
          .hki-light-popup-title ha-icon { --mdc-icon-size: 24px; }
          .hki-light-popup-title-text {
            display: flex; flex-direction: column; gap: 2px;
            font-size: 16px; font-weight: 500; color: var(--primary-text-color);
          }
          .hki-light-popup-state { font-size: 12px; opacity: 0.6; }
          .hki-light-popup-header-controls {
            display: flex; gap: 8px; align-items: center;
          }
          .header-btn {
            width: 40px; height: 40px; border-radius: 50%;
            background: var(--divider-color, rgba(255, 255, 255, 0.05)); border: none;
            color: var(--primary-text-color); cursor: pointer;
            display: flex; align-items: center; justify-content: center;
            transition: all 0.2s;
          }
          .header-btn:hover { background: rgba(255, 255, 255, 0.1); transform: scale(1.05); }
          .header-btn ha-icon { --mdc-icon-size: 20px; }

          .graphs-container { padding: 12px; height: 280px; box-sizing: border-box; }
          .graphs-container hui-history-graph-card { display: block; height: 100%; }
          .graphs-container ha-card { height: 100%; overflow: hidden; }

          .sensor-tiles { display: flex; flex-direction: column; gap: 12px; width: 100%; height: 100%; box-sizing: border-box; }
          .sensor-tile { background: rgba(255,255,255,0.05); border-radius: 18px; padding: 14px 14px 10px 14px; box-shadow: 0 6px 18px rgba(0,0,0,0.25); }
          .sensor-tile-top { display: flex; justify-content: space-between; align-items: baseline; gap: 10px; }
          .sensor-tile-title { font-size: 14px; font-weight: 600; opacity: 0.9; }
          .sensor-tile-value { font-size: 28px; font-weight: 700; letter-spacing: -0.5px; }
          .sensor-tile-graph { margin-top: 10px; height: 56px; width: 100%; overflow: hidden; border-radius: 14px; background: rgba(0,0,0,0.12); padding: 6px 8px; box-sizing: border-box; }
          .sensor-tile-graph svg { width: 100%; height: 100%; display: block; }


          .hki-light-popup-tabs {
            display: flex; gap: 8px; padding: 8px 20px;
            background: rgba(255, 255, 255, 0.03);
            border-bottom: 1px solid var(--divider-color, rgba(255, 255, 255, 0.05));
            flex-shrink: 0;
          }
          .hki-light-popup-tab {
            flex: 1; height: 40px; border-radius: 8px;
            background: transparent; border: none;
            color: var(--primary-text-color); cursor: pointer;
            display: flex; align-items: center; justify-content: center; gap: 8px;
            transition: all 0.2s; font-size: 14px; font-weight: 500;
          }
          .hki-light-popup-tab:hover { background: var(--secondary-background-color, rgba(255, 255, 255, 0.08)); }
          .hki-light-popup-tab.active { 
            background: var(--primary-color, rgba(255, 255, 255, 0.15)); 
            color: var(--text-primary-color, var(--primary-text-color));
            box-shadow: inset 0 -2px 0 0 var(--primary-color, rgba(255, 255, 255, 0.5));
          }
          .hki-light-popup-tab ha-icon { --mdc-icon-size: 18px; }
          
          .hki-light-popup-content {
            flex: 1; padding: 20px; overflow-y: auto; display: flex; flex-direction: column;
            align-items: center; justify-content: center; gap: 12px;
            min-height: 0;
            position: relative;
            overflow-x: hidden;
          }

          .hki-light-popup-content.view-favorites {
            align-items: stretch;
            justify-content: flex-start;
          }

          .save-favorite-fab {
            position: absolute; right: 16px; bottom: 16px;
            width: 44px; height: 44px; border-radius: 50%;
            background: rgba(255, 255, 255, 0.08);
            border: 1px solid rgba(255, 255, 255, 0.10);
            color: var(--primary-text-color);
            display: flex; align-items: center; justify-content: center;
            cursor: pointer;
            transition: transform 0.15s, background 0.15s;
          }
          .save-favorite-fab:hover { background: rgba(255, 255, 255, 0.14); transform: scale(1.05); }
          .save-favorite-fab ha-icon { --mdc-icon-size: 20px; }

          .favorites-view { width: 100%; height: 100%; position: relative; }

          /* Sticky header so the Edit button never scrolls with the grid */
          .favorites-sticky-header {
            position: sticky;
            top: 0;
            z-index: 6;
            display: flex;
            justify-content: flex-end;
            padding: 8px 0 8px 0;
            background: transparent;
            backdrop-filter: none;
          }

          .favorites-grid { width: 100%; padding-top: 16px; }
          .preset-picture {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            object-fit: cover;
            box-shadow: 0 2px 6px rgba(0,0,0,0.2);
          }


          /* Edit button under top tabs (top-right) */
          .favorites-edit-btn {
            position: relative;
            z-index: 1;
            display: flex; align-items: center; gap: 8px;
            background: var(--divider-color, rgba(255, 255, 255, 0.06));
            border: 1px solid rgba(255, 255, 255, 0.10);
            color: var(--primary-text-color);
            height: 34px; padding: 0 12px; border-radius: 999px;
            cursor: pointer;
          }
          .favorites-edit-btn:hover { background: rgba(255, 255, 255, 0.10); }
          .favorites-edit-btn ha-icon { --mdc-icon-size: 18px; }

          .preset-btn { position: relative; }
          .fav-delete-badge {
            position: absolute; top: 8px; right: 8px;
            width: 20px; height: 20px; border-radius: 50%;
            background: rgba(255, 255, 255, 0.10);
            border: 1px solid rgba(255, 255, 255, 0.12);
            display: flex; align-items: center; justify-content: center;
            color: var(--primary-text-color);
          }
          .fav-delete-badge:hover { background: rgba(255, 80, 80, 0.25); border-color: rgba(255, 80, 80, 0.35); }
          .fav-delete-badge ha-icon { --mdc-icon-size: 14px; }

          .value-display {
            font-size: 16px; font-weight: 500; color: var(--primary-text-color); 
            margin-bottom: 8px; opacity: 0.9; text-align: center;
            min-height: 22px;
          }
          .value-display span { font-size: 16px; opacity: 0.9; }
          
          .vertical-slider-container { width: 80px; height: 280px; position: relative; }
          .vertical-slider-track {
            width: 100%; height: 100%; background: var(--secondary-background-color, rgba(255, 255, 255, 0.1));
            border-radius: ${borderRadius}px; position: relative; overflow: hidden; cursor: pointer;
          }
          .vertical-slider-fill {
            position: absolute; bottom: 0; left: 0; right: 0;
            background: transparent;
            border-radius: 0 0 ${borderRadius}px ${borderRadius}px;
          }
          .vertical-slider-thumb {
            position: absolute; left: 50%; transform: translateX(-50%);
            width: 90px; height: 6px; background: white;
            border-radius: 4px; box-shadow: 0 0 0 2px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.3);
            cursor: grab; pointer-events: none;
          }
          .vertical-slider-thumb:active { cursor: grabbing; }

          .temp-gradient {
            background: linear-gradient(to bottom, 
              rgb(166, 209, 255) 0%,
              rgb(255, 255, 255) 50%,
              rgb(255, 200, 130) 100%) !important;
          }
          .temp-fill { background: transparent !important; }

          .color-section-container {
            display: flex; flex-direction: column; align-items: center; gap: 12px; width: 100%;
          }
          .color-name {
            font-size: 16px; font-weight: 500; color: var(--primary-text-color);
            opacity: 0.9; text-transform: capitalize; text-align: center;
            min-height: 22px;
          }
          .color-wheel {
            width: 280px; height: 280px; border-radius: 50%;
            background: conic-gradient(hsl(0, 100%, 50%), hsl(60, 100%, 50%), hsl(120, 100%, 50%), hsl(180, 100%, 50%), hsl(240, 100%, 50%), hsl(300, 100%, 50%), hsl(360, 100%, 50%));
            position: relative; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          }
          .color-wheel::after {
            content: ''; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
            width: 40%; height: 40%; border-radius: 50%; background: radial-gradient(circle, white 0%, transparent 70%);
          }
          .color-wheel-indicator {
            position: absolute; width: 28px; height: 28px; border-radius: 50%;
            border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            transform: translate(-50%, -50%); pointer-events: none; top: 50%; left: 50%;
            transition: top 0.3s, left 0.3s; 
          }

          .presets-container { 
            display: grid; 
            /* fixed 4-per-row grid (matches HKI style) */
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 12px; 
            width: 100%;
            box-sizing: border-box;
          }
          /* Favorites spacing under the fixed Edit header */
          .favorites-grid { padding-top: 16px; }
          .preset-picture { width: 32px; height: 32px; border-radius: 50%; object-fit: cover; box-shadow: 0 2px 6px rgba(0,0,0,0.2); }
          .preset-btn {
            aspect-ratio: 1; border-radius: 12px; border: 2px solid var(--divider-color, rgba(255, 255, 255, 0.1));
            background: transparent; cursor: pointer;
            display: flex; flex-direction: column; align-items: center; justify-content: flex-start;
            gap: 6px; transition: all 0.2s; padding: 10px 8px 8px 8px; outline: none;
            min-width: 0;
          }
          .preset-btn:hover { transform: scale(1.05); border-color: rgba(255, 255, 255, 0.3); }
          .preset-btn:active { transform: scale(0.95); }
          .preset-color { width: 32px; height: 32px; border-radius: 50%; box-shadow: 0 2px 6px rgba(0,0,0,0.2); }
          .preset-name {
            font-size: 10px;
            color: var(--primary-text-color);
            text-align: center;
            opacity: 0.8;
            max-width: 100%;
            word-break: break-word;
            /* keep circles aligned even with long text */
            height: 26px;
            overflow: hidden;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
          }

          .individual-container { width: 100%; flex: 1; overflow-y: auto; max-height: none; }
          .individual-item {
            padding: 12px 0; border-bottom: 1px solid var(--divider-color, rgba(255, 255, 255, 0.05));
            display: flex; align-items: center; gap: 12px;
          }
          .individual-item:last-child { border-bottom: none; }
          .individual-icon {
            width: 40px; height: 40px; border-radius: 50%;
            background: var(--divider-color, rgba(255, 255, 255, 0.05));
            display: flex; align-items: center; justify-content: center; flex-shrink: 0;
          }
          .individual-icon ha-icon { --mdc-icon-size: 20px; }
          .individual-info { flex: 1; display: flex; flex-direction: column; gap: 4px; min-width: 0; }
          .individual-name { font-size: 14px; font-weight: 500; }
          .individual-state { font-size: 12px; opacity: 0.6; }
          .individual-slider {
            flex: 2; height: 40px; background: var(--secondary-background-color, rgba(255, 255, 255, 0.1));
            border: 2px solid var(--divider-color, rgba(255, 255, 255, 0.1));
            border-radius: ${borderRadius}px; position: relative; overflow: hidden; cursor: pointer;
          }
          .individual-slider-fill {
            height: 100%; background: rgba(255, 255, 255, 0.18);
            border-radius: ${borderRadius}px 0 0 ${borderRadius}px;
            transition: width 0.2s;
          }
          /* For horizontal color/temp pickers we only show the handle (no fill) */
          .individual-slider[data-mode="color"] .individual-slider-fill,
          .individual-slider[data-mode="temp"] .individual-slider-fill { display: none; }
          .individual-slider[data-mode="brightness"] .individual-slider-fill { display: block !important; }
          .individual-slider-thumb {
            position: absolute; top: 0; transform: translateX(-50%);
            width: 12px; height: 100%; background: white; border-radius: 6px;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3); pointer-events: none; transition: left 0.2s;
          }

          .effects-list-container { width: 100%; }
          .effects-trigger {
            width: 100%; padding: 16px; background: var(--divider-color, rgba(255, 255, 255, 0.05));
            border: 2px solid var(--divider-color, rgba(255, 255, 255, 0.1)); border-radius: 12px;
            display: flex; align-items: center; justify-content: space-between;
            cursor: pointer; transition: all 0.2s; color: var(--primary-text-color);
          }
          .effects-trigger:hover { border-color: rgba(255, 255, 255, 0.3); }
          .effects-trigger-content { display: flex; align-items: center; gap: 12px; }
          .effects-trigger-content ha-icon { --mdc-icon-size: 24px; }
          .effects-trigger-arrow { transition: transform 0.3s; }
          .effects-trigger-arrow.expanded { transform: rotate(90deg); }
          .effects-list {
            margin-top: 12px; display: none; flex-direction: column; gap: 8px;
          }
          .effects-list.expanded { display: flex; }
          .effect-item {
            padding: 14px; background: rgba(255, 255, 255, 0.03);
            border: 1px solid var(--divider-color, rgba(255, 255, 255, 0.05)); border-radius: 8px;
            cursor: pointer; transition: all 0.2s;
            margin-bottom: 4px;
          }
          .effect-item:hover { background: rgba(255, 255, 255, 0.08); }
          .effect-item.active {
            background: rgba(255, 215, 0, 0.1); border-color: #FFD700;
          }

          .timeline-container { width: 100%; padding: 0 10px 10px 10px; box-sizing: border-box; overflow: visible; }
          /* Timeline styles (make line continuous like other popups) */
          .timeline-item { display: flex; gap: 16px; margin-bottom: 0; min-height: 40px; position: relative; }
          .timeline-visual { display: flex; flex-direction: column; align-items: center; width: 20px; flex-shrink: 0; }
          .timeline-dot {
            width: 10px; height: 10px; border-radius: 50%;
            z-index: 2; border: 2px solid var(--card-background-color, #1c1c1c);
            margin-top: 3px;
          }
          .timeline-line { width: 2px; flex-grow: 1; background: var(--divider-color, rgba(255,255,255,0.12)); margin-top: -2px; margin-bottom: -4px; }

          .timeline-item:last-child .timeline-line { display: none; }
          .timeline-content {
            flex: 1; padding-bottom: 16px; font-size: 13px; color: var(--primary-text-color);
          }
          .timeline-detail { font-size: 11px; opacity: 0.6; display: block; margin-top: 4px; }
          .timeline-ago { font-size: 10px; opacity: 0.5; display: block; margin-top: 2px; }
          .timeline-trigger { font-size: 10px; opacity: 0.5; display: block; margin-top: 2px; font-style: italic; }
          .history-loading { width: 100%; text-align: center; padding: 20px; opacity: 0.6; }

          .bottom-nav {
            display: flex; justify-content: space-around; align-items: center;
            padding: 8px 20px; border-top: 1px solid var(--divider-color, rgba(255, 255, 255, 0.05));
            background: rgba(255, 255, 255, 0.03); gap: 8px;
            flex-shrink: 0;
          }
          .nav-btn {
            flex: 1; height: 46px; border-radius: 8px;
            background: transparent; border: none;
            color: var(--primary-text-color); cursor: pointer;
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            gap: 2px;
            transition: all 0.2s; position: relative;
          }
          .nav-btn:hover { background: var(--secondary-background-color, rgba(255, 255, 255, 0.08)); }
          .nav-btn.active { 
            background: var(--primary-color, rgba(255, 255, 255, 0.15)); 
            color: var(--text-primary-color, var(--primary-text-color));
          }
          .nav-btn.power-on { color: #FFD700; }
          .nav-btn ha-icon { --mdc-icon-size: 20px; }
          .nav-label { font-size: 10px; line-height: 10px; opacity: 0.75; letter-spacing: 0.4px; }

          /* Climate Specific */
          .climate-slider-group { display: flex; flex-direction: column; align-items: center; gap: 12px; }
          .climate-dual-wrapper { display: flex; gap: 24px; justify-content: center; width: 100%; }
          .climate-label { font-size: 12px; opacity: 0.5; text-transform: uppercase; letter-spacing: 1px; }


        </style>
        <div class="hki-light-popup-container">
          <div class="hki-light-popup-header">
            <span class="hki-light-popup-title">
              <span id="hkiHeaderIconSlot"></span>
              <span class="hki-light-popup-title-text">
                ${entityName}
                <span class="hki-light-popup-state">${isOn ? brightness + '%' : 'Off'}${this._formatLastTriggered(entity) ? ` - ${this._formatLastTriggered(entity)}` : ''}</span>
              </span>
            </span>
            <div class="hki-light-popup-header-controls">
              ${isGroup ? '<button class="header-btn" id="individualLightsBtn"><ha-icon icon="mdi:lightbulb-group-outline"></ha-icon></button>' : ''}
              <button class="header-btn" id="historyBtn">
                <ha-icon icon="mdi:chart-box-outline"></ha-icon>
              </button>
              <button class="header-btn" id="closeBtn">
                <ha-icon icon="mdi:close"></ha-icon>
              </button>
            </div>
          </div>
          
          <div class="hki-light-popup-tabs">
            ${this._config.popup_show_favorites !== false ? `
              <button class="hki-light-popup-tab ${this._activeView === 'favorites' ? 'active' : ''}" id="scenesBtn" style="${this._activeView === 'favorites' ? this._getPopupButtonStyle(true) : this._getPopupButtonStyle(false)}"><ha-icon icon="mdi:star"></ha-icon><span>Favorites</span></button>
            ` : ''}
            ${this._config.popup_show_effects !== false ? `
              <button class="hki-light-popup-tab ${this._activeView === 'effects' ? 'active' : ''}" id="effectsBtn" style="${this._activeView === 'effects' ? this._getPopupButtonStyle(true) : this._getPopupButtonStyle(false)}"><ha-icon icon="mdi:auto-fix"></ha-icon><span>Effects</span></button>
            ` : ''}
          </div>
          
          <div class="hki-light-popup-content ${this._activeView === 'favorites' ? 'view-favorites' : ''}">
            ${this._getDomain() === 'climate' 
              ? this._renderClimateContent(entity) 
              : this._renderContent(isOn, brightness, supportsTemp, supportsColor, effectList, currentEffect, isGroup)
            }
          </div>
          
          <div class="bottom-nav">
            ${
              this._getDomain() === "climate"
                ? this._renderClimateNav(entity)
                : `
                  <button class="nav-btn ${isOn ? "power-on" : ""}" id="powerBtn" style="${isOn ? this._getPopupButtonStyle(true) : this._getPopupButtonStyle(false)}">
                    <ha-icon icon="mdi:power"></ha-icon>
                    ${this._config.popup_hide_button_text ? '' : '<span class="nav-label">Power</span>'}
                  </button>
                  <button class="nav-btn ${this._activeView === "brightness" ? "active" : ""}" id="brightnessBtn" style="${this._activeView === "brightness" ? this._getPopupButtonStyle(true) : this._getPopupButtonStyle(false)}">
                    <ha-icon icon="mdi:brightness-6"></ha-icon>
                    ${this._config.popup_hide_button_text ? '' : '<span class="nav-label">Bright</span>'}
                  </button>
                  ${
                    supportsTemp
                      ? `<button class="nav-btn ${this._activeView === "temperature" ? "active" : ""}" id="temperatureBtn" style="${this._activeView === "temperature" ? this._getPopupButtonStyle(true) : this._getPopupButtonStyle(false)}">
                          <ha-icon icon="mdi:thermometer"></ha-icon>
                          ${this._config.popup_hide_button_text ? '' : '<span class="nav-label">Temp</span>'}
                        </button>`
                      : ""
                  }
                  ${
                    supportsColor
                      ? `<button class="nav-btn ${this._activeView === "color" ? "active" : ""}" id="colorBtn" style="${this._activeView === "color" ? this._getPopupButtonStyle(true) : this._getPopupButtonStyle(false)}">
                          <ha-icon icon="mdi:palette"></ha-icon>
                          ${this._config.popup_hide_button_text ? '' : '<span class="nav-label">Color</span>'}
                        </button>`
                      : ""
                  }
                `
            }
          </div>
        </div>
      `;

      const container = portal.querySelector('.hki-light-popup-container');
      if (container) container.addEventListener('click', (e) => e.stopPropagation());

      let isBackgroundClick = false;

      portal.addEventListener('mousedown', (e) => {
        isBackgroundClick = (e.target === portal);
      });
      portal.addEventListener('touchstart', (e) => {
        isBackgroundClick = (e.target === portal);
      }, { passive: true });

      portal.addEventListener('click', (e) => {
        if (isBackgroundClick && e.target === portal) {
          this._closePopup();
        }
        isBackgroundClick = false;
      });

      document.body.appendChild(portal);
      this._popupPortal = portal;

      // Populate header icon (avoid rendering lit-html objects into innerHTML)
      try {
        const slot = portal.querySelector('#hkiHeaderIconSlot');
        if (slot) {
          slot.innerHTML = '';
          const cfgIcon = (typeof this._config.icon === 'string' && this._config.icon && this._config.icon !== '[object Object]') ? this._config.icon : null;
          if (cfgIcon) {
            const el = document.createElement('ha-icon');
            el.setAttribute('icon', cfgIcon);
            el.style.color = this._getCurrentColor();
            el.style.transition = 'color 0.3s';
            slot.appendChild(el);
          } else {
            const el = document.createElement('ha-state-icon');
            el.hass = this.hass;
            el.stateObj = entity;
            el.style.setProperty('--mdc-icon-size', '22px');
            el.style.color = this._getCurrentColor();
            el.style.transition = 'color 0.3s';
            slot.appendChild(el);
          }
        }
      } catch (e) {
        // ignore
      }

      this._setupPopupHandlers(portal);
      this._setupContentHandlers(portal);
      
      if (this._activeView === 'color') {
          setTimeout(() => this._setInitialColorIndicator(), 100);
      }
    }

    _renderClimatePopupPortal(entity) {
      if (this._popupPortal) this._popupPortal.remove();
      if (!entity) return;

      const name = this._config.name || entity.attributes.friendly_name || this._config.entity;
      const attrs = entity.attributes || {};
      const mode = entity.state;
      const unit = this._getTempUnit(entity);
      const color = (HVAC_COLORS && HVAC_COLORS[mode]) || HVAC_COLORS.off || 'var(--primary-color)';
      const borderRadius = this._config.popup_slider_radius ?? 12;

      // Keep temp constraints in sync (also used by slider handlers)
      this._tempMin = attrs.min_temp || 7;
      this._tempMax = attrs.max_temp || 35;
      this._step = this._config.climate_temp_step ?? attrs.target_temp_step ?? 0.5;

      const presetList = attrs.preset_modes || [];
      const fanList = attrs.fan_modes || [];

      const valueSize = this._config.popup_value_font_size || 36;
      const valueWeight = this._config.popup_value_font_weight || 300;

      const portal = document.createElement('div');
      portal.className = 'hki-popup-portal';

      const renderStateLine = () => {
        const cur = this._getClimateBadgeTemperature(entity);
        const curText = (cur !== undefined && cur !== null && cur !== '') ? ` • ${cur}${unit}` : '';
        return `${String(mode).replace(/_/g, ' ')}${curText}`;
      };

      portal.innerHTML = `
        <style>
          .hki-popup-portal {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.7);
            display: flex; align-items: center; justify-content: center; z-index: 9999;
          }
          .hki-popup-container {
            background: var(--card-background-color, #1c1c1c);
            border-radius: 16px;
            width: 90%; max-width: 400px; height: 600px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
            display: flex; flex-direction: column; overflow: hidden;
          }
          .hki-popup-header {
            display: flex; justify-content: space-between; align-items: center; padding: 16px 20px;
            background: rgba(255, 255, 255, 0.03); border-bottom: 1px solid var(--divider-color, rgba(255, 255, 255, 0.05));
            flex-shrink: 0;
          }
          .hki-popup-title { display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0; }
          .hki-popup-title ha-icon { --mdc-icon-size: 24px; }
          .hki-popup-title-text { display: flex; flex-direction: column; gap: 2px; font-size: 16px; font-weight: 500; min-width: 0; }
          .hki-popup-state { font-size: 12px; opacity: 0.6; text-transform: capitalize; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
          .hki-popup-header-controls { display: flex; gap: 8px; align-items: center; }
          .header-btn {
            width: 40px; height: 40px; border-radius: 50%;
            background: var(--divider-color, rgba(255, 255, 255, 0.05)); border: none;
            color: var(--primary-text-color); cursor: pointer;
            display: flex; align-items: center; justify-content: center;
            transition: all 0.2s;
          }
          .header-btn:hover { background: rgba(255, 255, 255, 0.1); transform: scale(1.05); }
          .header-btn ha-icon { --mdc-icon-size: 20px; }

          .hki-tabs {
            display: flex; gap: 8px; padding: 8px 20px;
            background: rgba(255, 255, 255, 0.02);
            border-bottom: 1px solid var(--divider-color, rgba(255, 255, 255, 0.05));
            flex-shrink: 0;
          }
          .tab-btn {
            flex: 1; height: 40px; border-radius: 8px;
            background: transparent; border: 1px solid var(--divider-color, rgba(255,255,255,0.1));
            color: var(--primary-text-color); cursor: pointer;
            display: flex; align-items: center; justify-content: center; gap: 8px;
            transition: all 0.2s; font-size: 14px; font-weight: 500;
          }
          .tab-btn:hover { background: var(--secondary-background-color, rgba(255,255,255,0.08)); }
          .tab-btn.active { 
            background: var(--primary-color, rgba(255,255,255,0.12)); 
            border-color: transparent; 
            color: var(--text-primary-color, var(--primary-text-color));
          }

          .hki-popup-content { flex: 1; padding: 20px; overflow-y: auto; display: flex; align-items: center; justify-content: center; min-height: 0; }
          .sliders-wrapper { display: flex; gap: 24px; justify-content: center; width: 100%; align-items: center; }
          .slider-group { display: flex; flex-direction: column; align-items: center; gap: 12px; height: 320px; width: 80px; }
          .value-display { font-size: ${valueSize}px; font-weight: ${valueWeight}; text-align: center; }
          .value-display span { font-size: ${Math.max(14, Math.round(valueSize/2))}px; opacity: 0.7; }
          .slider-label { font-size: 12px; opacity: 0.5; text-transform: uppercase; letter-spacing: 1px; }

          .vertical-slider-track {
            width: 100%; flex: 1; 
            background: var(--secondary-background-color, rgba(255, 255, 255, 0.1));
            border: 2px solid var(--divider-color, rgba(255, 255, 255, 0.1));
            border-radius: ${borderRadius}px; position: relative; overflow: hidden; cursor: pointer;
          }
          .vertical-slider-fill {
            position: absolute; bottom: 0; left: 0; right: 0;
            background: ${color}; transition: background 0.3s;
            border-radius: 0 0 ${borderRadius}px ${borderRadius}px;
          }
          .vertical-slider-thumb {
            position: absolute; left: 50%; transform: translateX(-50%);
            width: 90px; height: 6px; background: white;
            border-radius: 4px; box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            pointer-events: none;
          }

          /* Vertical slider with +/- buttons */
          .slider-with-buttons {
            display: flex; align-items: center; justify-content: center; width: 100%;
            position: relative;
          }
          .vertical-temp-buttons {
            display: flex; flex-direction: column; gap: 12px;
            position: absolute; right: 0px;
          }
          .vertical-temp-btn {
            width: 48px; height: 48px; border-radius: 50%; border: none;
            background: var(--secondary-background-color, rgba(255,255,255,0.1));
            color: var(--primary-text-color); cursor: pointer;
            display: flex; align-items: center; justify-content: center;
            transition: all 0.2s;
          }
          .vertical-temp-btn:hover {
            background: var(--primary-color, rgba(255,255,255,0.2));
            transform: scale(1.1);
          }
          .vertical-temp-btn:active {
            transform: scale(0.95);
          }
          .vertical-temp-btn ha-icon {
            --mdc-icon-size: 24px;
          }

          /* Circular slider styles */
          .circular-slider-wrapper {
            display: flex; align-items: center; justify-content: center; gap: 24px; width: 100%;
            position: relative;
          }
          .circular-slider-container {
            position: relative; width: 280px; height: 280px; display: flex; align-items: center; justify-content: center;
            cursor: pointer; user-select: none; flex-shrink: 0;
          }
          .circular-slider-svg {
            position: absolute; top: 0; left: 0; filter: drop-shadow(0 4px 12px rgba(0,0,0,0.3));
          }
          .circular-value-display {
            position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
            text-align: center; pointer-events: none;
          }
          .circular-temp-label-top {
            opacity: 0.6; text-transform: uppercase; letter-spacing: 1.5px;
            margin-bottom: 12px;
          }
          .circular-temp-value {
            color: var(--primary-text-color);
            line-height: 1;
          }
          .circular-temp-value span {
            opacity: 0.7;
          }
          .circular-temp-buttons {
            display: flex; flex-direction: column; gap: 12px;
            position: absolute; right: 0px;
          }
          .circular-temp-btn {
            width: 48px; height: 48px; border-radius: 50%; border: none;
            background: var(--secondary-background-color, rgba(255,255,255,0.1));
            color: var(--primary-text-color); cursor: pointer;
            display: flex; align-items: center; justify-content: center;
            transition: all 0.2s;
          }
          .circular-temp-btn:hover {
            background: var(--primary-color, rgba(255,255,255,0.2));
            transform: scale(1.1);
          }
          .circular-temp-btn:active {
            transform: scale(0.95);
          }
          .circular-temp-btn ha-icon {
            --mdc-icon-size: 24px;
          }

          .hki-popup-nav {
            display: flex; justify-content: space-evenly; padding: 12px;
            background: rgba(255, 255, 255, 0.03); border-top: 1px solid var(--divider-color, rgba(255, 255, 255, 0.05));
            gap: 8px; overflow-x: auto;
            flex-shrink: 0;
          }
          .nav-btn {
            min-width: 64px; height: 52px; border-radius: 12px; border: none;
            background: transparent; color: var(--primary-text-color);
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            gap: 2px;
            cursor: pointer;
            transition: all 0.2s;
            flex-shrink: 0;
          }
          .nav-btn:hover { background: var(--secondary-background-color, rgba(255, 255, 255, 0.1)); }
          .nav-btn.active { 
            background: var(--primary-color, rgba(255, 255, 255, 0.15)); 
            box-shadow: 0 2px 8px rgba(0,0,0,0.15), inset 0 1px 0 0 rgba(255,255,255,0.1);
            color: var(--text-primary-color, var(--primary-text-color));
          }
          .nav-btn ha-icon { --mdc-icon-size: 22px; }
          .nav-label { font-size: 10px; line-height: 10px; opacity: 0.75; letter-spacing: 0.4px; text-transform: uppercase; }

          .timeline-container { width: 100%; padding: 0 10px 10px 10px; box-sizing: border-box; overflow: visible; }
          .timeline-item { display: flex; gap: 16px; margin-bottom: 0; min-height: 40px; position: relative; }
          .timeline-time { width: 60px; text-align: right; font-size: 12px; color: var(--secondary-text-color); padding-top: 2px; flex-shrink: 0; font-family: monospace; }
          .timeline-visual { display: flex; flex-direction: column; align-items: center; width: 20px; flex-shrink: 0; }
          .timeline-dot { width: 10px; height: 10px; border-radius: 50%; background: var(--primary-color, #FFD700); z-index: 2; border: 2px solid var(--card-background-color, #1c1c1c); }
          .timeline-line { width: 2px; flex-grow: 1; background: var(--divider-color, rgba(255,255,255,0.1)); margin-top: -2px; margin-bottom: -4px; }
          .timeline-item:last-child .timeline-line { display: none; }
          .timeline-content { flex: 1; padding-bottom: 16px; font-size: 13px; color: var(--primary-text-color); }
          .timeline-detail { font-size: 11px; opacity: 0.6; display: block; margin-top: 4px; }
          .timeline-ago { font-size: 10px; opacity: 0.5; display: block; margin-top: 2px; }
          .timeline-trigger { font-size: 10px; opacity: 0.5; display: block; margin-top: 2px; font-style: italic; }
          .history-loading { width: 100%; text-align: center; padding: 20px; opacity: 0.6; }

          .list-container { width: 100%; display: flex; flex-direction: column; gap: 8px; overflow-y: auto; max-height: 100%; }
          .list-item { padding: 14px; background: rgba(255,255,255,0.05); border-radius: 8px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; }
          .list-item.active { background: ${color}; color: white; }
        </style>

        <div class="hki-popup-container">
          <div class="hki-popup-header">
            <div class="hki-popup-title">
              <ha-icon icon="${(entity.attributes && entity.attributes.icon) || this._config.icon || HVAC_ICONS[mode] || 'mdi:thermostat'}" style="color: ${color}"></ha-icon>
              <div class="hki-popup-title-text">
                ${name}
                <span class="hki-popup-state">${renderStateLine()}${this._formatLastTriggered(entity) ? ` - ${this._formatLastTriggered(entity)}` : ''}</span>
              </div>
            </div>
            <div class="hki-popup-header-controls">
                            <button class="header-btn" id="graphBtn"><ha-icon icon="mdi:chart-line"></ha-icon></button>
              <button class="header-btn" id="historyBtn"><ha-icon icon="mdi:chart-box-outline"></ha-icon></button>
              <button class="header-btn" id="closeBtn"><ha-icon icon="mdi:close"></ha-icon></button>
            </div>
          </div>

          <div class="hki-tabs">
            <button class="tab-btn ${this._activeView === 'main' ? 'active' : ''}" id="tabMain" style="${this._activeView === 'main' ? this._getPopupButtonStyle(true) : this._getPopupButtonStyle(false)}"><ha-icon icon="mdi:fire"></ha-icon><span>Heat</span></button>
            ${(this._config.popup_show_presets !== false && presetList.length) ? `<button class="tab-btn ${this._activeView === 'presets' ? 'active' : ''}" id="tabPresets" style="${this._activeView === 'presets' ? this._getPopupButtonStyle(true) : this._getPopupButtonStyle(false)}"><ha-icon icon="mdi:tune"></ha-icon><span>Presets</span></button>` : ''}
            ${fanList.length ? `<button class="tab-btn ${this._activeView === 'fan' ? 'active' : ''}" id="tabFan" style="${this._activeView === 'fan' ? this._getPopupButtonStyle(true) : this._getPopupButtonStyle(false)}"><ha-icon icon="mdi:fan"></ha-icon><span>Fan</span></button>` : ''}
          </div>

          <div class="hki-popup-content" id="popupContent">
            ${this._renderClimatePopupContent(entity, color)}
          </div>

          <div class="hki-popup-nav">
            ${this._renderClimatePopupHvacModes(entity)}
          </div>
        </div>
      `;

      const container = portal.querySelector('.hki-popup-container');
      if (container) container.addEventListener('click', (e) => e.stopPropagation());

      let isBackgroundClick = false;
      portal.addEventListener('mousedown', (e) => { isBackgroundClick = (e.target === portal); });
      portal.addEventListener('touchstart', (e) => { isBackgroundClick = (e.target === portal); }, { passive: true });
      portal.addEventListener('click', (e) => {
        if (isBackgroundClick && e.target === portal) this._closePopup();
        isBackgroundClick = false;
      });

      document.body.appendChild(portal);
      this._popupPortal = portal;

      const closeBtn = portal.querySelector('#closeBtn');
      if (closeBtn) closeBtn.addEventListener('click', () => this._closePopup());
      const historyBtn = portal.querySelector('#historyBtn');
      if (historyBtn) {
        historyBtn.addEventListener('click', () => {
          this._activeView = 'history';
          const content = portal.querySelector('#popupContent');
          if (content) {
            content.innerHTML = `<div class="timeline-container" data-view-type="history" id="historyContainer"><div class="history-loading">Loading Timeline...</div></div>`;
            setTimeout(() => this._loadHistory(), 100);
          }
          portal.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        });
      }

      const graphBtn = portal.querySelector('#graphBtn');
      if (graphBtn) {
        graphBtn.addEventListener('click', () => {
          this._activeView = 'graphs';
          const content = portal.querySelector('#popupContent');
          if (content) {
            content.innerHTML = `<div class="graphs-container" id="graphsContainer"></div>`;
            setTimeout(() => this._mountClimateSensorTiles(portal), 50);
          }
          portal.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        });
      }

      const tabMain = portal.querySelector('#tabMain');
      const tabPresets = portal.querySelector('#tabPresets');
      const tabFan = portal.querySelector('#tabFan');

      const switchView = (view) => {
        this._activeView = view;
        if (tabMain) tabMain.classList.toggle('active', view === 'main');
        if (tabPresets) tabPresets.classList.toggle('active', view === 'presets');
        if (tabFan) tabFan.classList.toggle('active', view === 'fan');

        const content = portal.querySelector('#popupContent');
        if (content) content.innerHTML = this._renderClimatePopupContent(this._getEntity(), color);

        if (view === 'main') {
          if (this._config.climate_use_circular_slider) {
            this._setupCircularSliderHandlers(portal);
          } else {
            this._setupClimatePopupSliders(portal);
            this._setupVerticalPlusMinusButtons(portal);
          }
        }
        if (view === 'presets') this._setupClimatePopupListHandlers(portal, 'preset');
        if (view === 'fan') this._setupClimatePopupListHandlers(portal, 'fan');
      };

      if (tabMain) tabMain.addEventListener('click', () => switchView('main'));
      if (tabPresets) tabPresets.addEventListener('click', () => switchView('presets'));
      if (tabFan) tabFan.addEventListener('click', () => switchView('fan'));

      // HVAC mode buttons
      portal.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const hvacMode = btn.dataset.mode;
          if (!hvacMode) return;
          if (hvacMode !== 'off') {
            try { localStorage.setItem(`hki_climate_last_mode:${this._config.entity}`, hvacMode); } catch (e) {}
          }
          // Optimistic UI: highlight immediately
          this._optimisticHvacMode = hvacMode;
          portal.querySelectorAll('.nav-btn').forEach(b => {
            b.classList.remove('active');
            b.style.background = '';
            b.style.color = '';
          });
          btn.classList.add('active');
          if (HVAC_COLORS && HVAC_COLORS[hvacMode]) btn.style.color = HVAC_COLORS[hvacMode];

          this.hass.callService('climate', 'set_hvac_mode', { entity_id: this._config.entity, hvac_mode: hvacMode });
        });
      });

      if (this._activeView === 'main') {
        if (this._config.climate_use_circular_slider) {
          this._setupCircularSliderHandlers(portal);
        } else {
          this._setupClimatePopupSliders(portal);
          this._setupVerticalPlusMinusButtons(portal);
        }
      }
      if (this._activeView === 'presets') this._setupClimatePopupListHandlers(portal, 'preset');
      if (this._activeView === 'fan') this._setupClimatePopupListHandlers(portal, 'fan');
    }

    _renderClimatePopupContent(entity, color) {
      if (!entity) return '';
      const attrs = entity.attributes || {};
      const mode = entity.state;

      if (this._activeView === 'history') {
        return `<div class=\"timeline-container\" data-view-type=\"history\" id=\"historyContainer\"><div class=\"history-loading\">Loading Timeline...</div></div>`;
      }

      if (this._activeView === 'graphs') {
        return `<div class=\"graphs-container\" id=\"graphsContainer\"></div>`;
      }

      if (this._activeView === 'presets') return this._renderClimatePopupList(attrs.preset_modes, attrs.preset_mode, 'preset', color);
      if (this._activeView === 'fan') return this._renderClimatePopupList(attrs.fan_modes, attrs.fan_mode, 'fan', color);

      if (mode === 'off') {
        return `<div style="opacity: 0.5; font-size: 18px; font-weight: 500;">System is Off</div>`;
      }

      // Use circular slider if enabled
      if (this._config.climate_use_circular_slider) {
        return this._renderCircularTemperatureControl(entity, mode, color);
      }

      const isRange = (mode === 'heat_cool' || mode === 'auto') && (attrs.target_temp_high !== undefined && attrs.target_temp_low !== undefined);
      const range = this._tempMax - this._tempMin;
      const unit = attrs.temperature_unit || this.hass?.config?.unit_system?.temperature || '°';
      const showButtons = this._config.climate_show_plus_minus === true;

      const renderSlider = (id, value, label) => {
        const v = (value === undefined || value === null) ? '--' : value;
        const pct = (value === undefined || value === null) ? 0 : ((value - this._tempMin) / range) * 100;
        const background = this._config.climate_show_gradient === false ? color : this._getTempGradient();
        return `
          <div class="slider-group">
            <div class="value-display" id="display-${id}">${v}<span>${unit}</span></div>
            <div class="vertical-slider-track" id="slider-${id}" data-type="${id}">
              <div class="vertical-slider-fill" style="height: ${pct}%; background: ${background};"></div>
              <div class="vertical-slider-thumb" style="bottom: calc(${pct}% - 6px)"></div>
            </div>
            ${label ? `<div class="slider-label">${label}</div>` : ''}
          </div>
        `;
      };

      const wrapWithButtons = (sliderContent) => {
        if (!showButtons) return sliderContent;
        return `
          <div class="slider-with-buttons">
            ${sliderContent}
            <div class="vertical-temp-buttons">
              <button class="vertical-temp-btn plus" data-action="plus">
                <ha-icon icon="mdi:plus"></ha-icon>
              </button>
              <button class="vertical-temp-btn minus" data-action="minus">
                <ha-icon icon="mdi:minus"></ha-icon>
              </button>
            </div>
          </div>
        `;
      };

      if (isRange) {
        const sliders = `<div class="sliders-wrapper">
          ${renderSlider('target_temp_low', attrs.target_temp_low, 'Low')}
          ${renderSlider('target_temp_high', attrs.target_temp_high, 'High')}
        </div>`;
        return wrapWithButtons(sliders);
      }

      const slider = `<div class="sliders-wrapper">
        ${renderSlider('temperature', attrs.temperature ?? attrs.current_temperature, 'Target')}
      </div>`;
      return wrapWithButtons(slider);
    }

    _renderCircularTemperatureControl(entity, mode, color) {
      const attrs = entity.attributes || {};
      const temperature = attrs.temperature ?? attrs.current_temperature;
      const unit = attrs.temperature_unit || this.hass?.config?.unit_system?.temperature || '°';
      const range = this._tempMax - this._tempMin;
      const value = temperature ?? this._tempMin;
      const percentage = ((value - this._tempMin) / range) * 100;
      const showButtons = this._config.climate_show_plus_minus === true;
      const useGradient = this._config.climate_show_gradient !== false; // Default true
      
      // Calculate arc length for partial circle (270 degrees = 75% of circle)
      const maxArcLength = 628.32 * 0.75; // 75% of full circumference
      const arcLength = (percentage / 100) * maxArcLength;
      
      // Calculate thumb position on 270-degree arc
      // Arc starts at 135 degrees and spans 270 degrees
      const startAngle = 135 * (Math.PI / 180); // Convert to radians
      const arcAngle = (percentage / 100) * 270 * (Math.PI / 180); // Angle within the arc
      const totalAngle = startAngle + arcAngle;
      const thumbX = 140 + 100 * Math.cos(totalAngle);
      const thumbY = 140 + 100 * Math.sin(totalAngle);
      
      // Get mode label
      const modeLabels = {
        'heat': 'HEATING',
        'cool': 'COOLING',
        'heat_cool': 'AUTO',
        'auto': 'AUTO',
        'dry': 'DRY',
        'fan_only': 'FAN',
        'off': 'OFF'
      };
      const modeLabel = modeLabels[mode] || mode.toUpperCase();
      
      // Get font sizes from config
      const valueSize = this._config.popup_value_font_size || 64;
      const labelSize = this._config.popup_label_font_size || 11;
      const valueWeight = this._config.popup_value_font_weight || 200;
      const labelWeight = this._config.popup_label_font_weight || 500;
      
      // Gradient goes from cold (cyan) at start to hot (orange) at end
      const strokeColor = useGradient ? 'url(#tempGradient)' : color;
      
      return `
        <div class="circular-slider-wrapper">
          <div class="circular-slider-container" id="circularSlider">
            <svg class="circular-slider-svg" viewBox="0 0 280 280" width="280" height="280">
              ${useGradient ? `
              <defs>
                <linearGradient id="tempGradient" x1="100%" y1="0%" x2="0%" y2="0%">
                  <stop offset="0%" style="stop-color:#00D9FF;stop-opacity:1" />
                  <stop offset="25%" style="stop-color:#00E5A0;stop-opacity:1" />
                  <stop offset="50%" style="stop-color:#DFFF00;stop-opacity:1" />
                  <stop offset="75%" style="stop-color:#FFB800;stop-opacity:1" />
                  <stop offset="100%" style="stop-color:#FF8C00;stop-opacity:1" />
                </linearGradient>
              </defs>
              ` : ''}
              
              <!-- Background arc (partial circle) -->
              <circle 
                cx="140" cy="140" r="100" 
                fill="none" 
                stroke="var(--divider-color, rgba(255,255,255,0.05))" 
                stroke-width="20"
                stroke-dasharray="${maxArcLength} 628.32"
                transform="rotate(135 140 140)"
              />
              
              <!-- Progress arc with gradient (partial circle) -->
              <circle 
                cx="140" cy="140" r="100" 
                fill="none" 
                stroke="${strokeColor}" 
                stroke-width="20"
                stroke-linecap="round"
                stroke-dasharray="${arcLength} 628.32"
                transform="rotate(135 140 140)"
                class="circular-progress"
                id="circularProgress"
              />
              
              <!-- Thumb handle -->
              <circle 
                cx="${thumbX}" 
                cy="${thumbY}" 
                r="12" 
                fill="white"
                stroke="var(--card-background-color, #1c1c1c)"
                stroke-width="3"
                class="circular-thumb"
                id="circularThumb"
                style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));"
              />
            </svg>
            
            <div class="circular-value-display">
              <div class="circular-temp-label-top" style="font-size: ${labelSize}px; font-weight: ${labelWeight};">${modeLabel} TO</div>
              <div class="circular-temp-value" id="circularTempValue" style="font-size: ${valueSize}px; font-weight: ${valueWeight};">${value}<span style="font-size: ${valueSize / 2}px;">${unit}</span></div>
            </div>
          </div>
          
          ${showButtons ? `
            <div class="circular-temp-buttons">
              <button class="circular-temp-btn plus" data-action="plus">
                <ha-icon icon="mdi:plus"></ha-icon>
              </button>
              <button class="circular-temp-btn minus" data-action="minus">
                <ha-icon icon="mdi:minus"></ha-icon>
              </button>
            </div>
          ` : ''}
        </div>
      `;
    }

    _renderClimatePopupList(items, current, type, color) {
      if (!items || !items.length) return '<div style="opacity:0.6">Not available</div>';
      return `
        <div class="list-container">
          ${items.map(item => `
            <div class="list-item ${item === current ? 'active' : ''}" data-value="${item}" data-type="${type}">
              <span>${item}</span>
              ${item === current ? '<ha-icon icon="mdi:check"></ha-icon>' : ''}
            </div>
          `).join('')}
        </div>
      `;
    }

    _renderClimatePopupHvacModes(entity) {
      const modes = entity?.attributes?.hvac_modes || [];
      const current = this._optimisticHvacMode ?? entity?.state;
      const labelize = (s) => String(s || '').replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
      return modes.map(m => {
        const isActive = m === current;
        const customStyle = isActive ? this._getPopupButtonStyle(true) : this._getPopupButtonStyle(false);
        const colorStyle = isActive ? `color:${(m === 'off') ? 'var(--primary-text-color)' : ((HVAC_COLORS && HVAC_COLORS[m]) || '')}` : '';
        const combinedStyle = [customStyle, colorStyle].filter(s => s).join('; ');
        
        return `
        <button class="nav-btn ${isActive ? 'active' : ''}" data-mode="${m}" style="${combinedStyle}">
          <ha-icon icon="${HVAC_ICONS[m] || 'mdi:thermostat'}"></ha-icon>
          ${this._config.popup_hide_button_text ? '' : `<span class="nav-label">${labelize(m)}</span>`}
        </button>
      `;
      }).join('');
    }





    
    async _mountClimateSensorTiles(portal) {
      try {
        const host = portal.querySelector('#graphsContainer');
        if (!host) return;
        host.innerHTML = '';

        const climateEnt = this._getEntity();
        if (!climateEnt) {
          host.innerHTML = '<div class="history-loading">Entity not found</div>';
          return;
        }

        const attrs = climateEnt.attributes || {};

        const exists = (eid) => !!(eid && this.hass && this.hass.states && this.hass.states[eid]);

        // Prefer explicit overrides; fall back to auto-discovery; finally fall back to attributes history on the climate entity
        const tempOverride = this._config.climate_current_temperature_entity || '';
        const humOverride = this._config.climate_humidity_entity || '';
        const pressOverride = this._config.climate_pressure_entity || '';

        const base = (climateEnt.entity_id || '').replace('climate.', '');
        const firstExisting = (candidates) => candidates.find(exists) || '';

        const tempAuto = firstExisting([
          `sensor.${base}_temperature`,
          `sensor.${base}_temp`,
          `sensor.${base}_current_temperature`,
          `sensor.${base}_current_temp`,
          `sensor.${base}_temp_current`,
        ]);
        const humAuto = firstExisting([
          `sensor.${base}_humidity`,
          `sensor.${base}_current_humidity`,
          `sensor.${base}_rh`,
          `sensor.${base}_relative_humidity`,
        ]);
        const pressAuto = firstExisting([
          `sensor.${base}_pressure`,
          `sensor.${base}_air_pressure`,
          `sensor.${base}_barometric_pressure`,
        ]);

        // Attribute fallbacks (for value display) — these are common on climate entities
        const attrKeys = {
          temperature: ['current_temperature', 'temperature'],
          humidity: ['current_humidity', 'humidity'],
          pressure: ['current_pressure', 'pressure', 'air_pressure'],
        };
        const pickAttrKey = (keys) => keys.find((k) => attrs[k] !== undefined && attrs[k] !== null);

        const tiles = [];

        const addTile = (key, titleKey, unitFallback, overrideId, autoId, attrKeyCandidates, titleOverride) => {
          const graphEntity = overrideId || autoId || '';
          const hasGraphEntity = exists(graphEntity);
          const attrKey = pickAttrKey(attrKeyCandidates);

          // If we have neither a sensor entity nor an attribute to show, skip
          if (!hasGraphEntity && !attrKey) return;

          tiles.push({
            key,
            titleKey,
            titleOverride,
            graphEntity: hasGraphEntity ? graphEntity : null,
            attrKey: hasGraphEntity ? null : attrKey, // only use attribute-series when no override/auto entity exists
            unitFallback,
          });
        };

        addTile('temperature', 'current_temperature', this._getTempUnit(climateEnt), tempOverride, tempAuto, attrKeys.temperature, this._config.climate_temperature_name);
        addTile('humidity', 'current_humidity', '%', humOverride, humAuto, attrKeys.humidity, this._config.climate_humidity_name);
        addTile('pressure', 'current_pressure', 'hPa', pressOverride, pressAuto, attrKeys.pressure, this._config.climate_pressure_name);

        if (!tiles.length) {
          host.innerHTML = '<div class="history-loading">No sensor data found. Configure Climate: Current Temp / Humidity / Pressure entities.</div>';
          return;
        }

        host.innerHTML = `<div class="sensor-tiles" id="sensorTiles"></div>`;
        const tilesHost = host.querySelector('#sensorTiles');

        const colorFor = (n) => {
          const nn = Math.max(0, Math.min(1, n));
          const hue = 200 * (1 - nn); // 200=blue, 0=red
          return `hsl(${hue}, 90%, 60%)`;
        };

        const parseSeries = (history, attrKey = null) => {
          const points = [];
          for (const it of (history || [])) {
            const ts = (it?.lu ?? it?.last_updated ?? it?.last_changed);
            if (!ts) continue;
            let raw = null;
            if (attrKey) {
              const a = it?.a ?? it?.attributes;
              raw = a ? a[attrKey] : null;
            } else {
              raw = (it?.s ?? it?.state);
            }
            const n = (typeof raw === 'number') ? raw : parseFloat(String(raw));
            if (!Number.isFinite(n)) continue;
            points.push({ t: new Date(ts).getTime(), v: n });
          }
          points.sort((a, b) => a.t - b.t);
          return points;
        };

        const downsample = (pts, maxN = 60) => {
          if (pts.length <= maxN) return pts;
          const step = Math.ceil(pts.length / maxN);
          const out = [];
          for (let i = 0; i < pts.length; i += step) out.push(pts[i]);
          if (out[out.length - 1] !== pts[pts.length - 1]) out.push(pts[pts.length - 1]);
          return out;
        };

        const buildSvg = (pts, width = 260, height = 56) => {
          if (!pts || pts.length < 2) return null;
          const minV = Math.min(...pts.map(p => p.v));
          const maxV = Math.max(...pts.map(p => p.v));
          const span = (maxV - minV) || 1;
          const t0 = pts[0].t;
          const t1 = pts[pts.length - 1].t;
          const tSpan = (t1 - t0) || 1;

          const xy = pts.map(p => {
            const x = (p.t - t0) / tSpan * width;
            const y = height - ((p.v - minV) / span * height);
            return { x, y, v: p.v };
          });

          const gradId = `grad-${Math.random().toString(16).slice(2)}`;
          const stops = [];
          const stopCount = Math.min(12, xy.length);
          for (let i = 0; i < stopCount; i++) {
            const idx = Math.round(i * (xy.length - 1) / (stopCount - 1 || 1));
            const p = xy[idx];
            const n = (p.v - minV) / span;
            const offset = (p.x / width) * 100;
            stops.push(`<stop offset="${offset.toFixed(1)}%" stop-color="${colorFor(n)}" />`);
          }

          const line = xy.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
          const area = `0,${height.toFixed(1)} ${line} ${width.toFixed(1)},${height.toFixed(1)}`;

          return {
            svg: `
              <svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" class="sparkline">
                <defs>
                  <linearGradient id="${gradId}" x1="0" y1="0" x2="1" y2="0">
                    ${stops.join('')}
                  </linearGradient>
                </defs>
                <polygon points="${area}" fill="url(#${gradId})" opacity="0.12"></polygon>
                <polyline points="${line}" fill="none" stroke="url(#${gradId})" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"></polyline>
              </svg>`
          };
        };

        const climateName = this._config.name || attrs.friendly_name || climateEnt.entity_id;
        const pretty = (s) => String(s || '')
          .split('_')
          .filter(Boolean)
          .map(w => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');

        // Render shells first
        tilesHost.innerHTML = tiles.map((t, idx) => {
          // Title should be: <Climate Name> <Attribute>
          // If we are charting a sensor override/auto entity, we still use the tile label
          // If we are charting a climate attribute series, we use the attribute key prettified
          const attrTitle = t.titleOverride || pretty(t.titleKey || t.attrKey || t.key);
          let name = `${climateName} ${attrTitle}`;
          let unit = t.unitFallback || '';
          let value = '--';

          if (t.graphEntity) {
            const st = this.hass.states[t.graphEntity];
            unit = st?.attributes?.unit_of_measurement || unit;
            value = st?.state ?? '--';
          } else if (t.attrKey) {
            value = attrs[t.attrKey];
          }

          return `
            <div class="sensor-tile" data-key="${t.key}">
              <div class="sensor-tile-top">
                <div class="sensor-tile-title">${name}</div>
                <div class="sensor-tile-value">${value}<span class="sensor-tile-unit">${unit}</span></div>
              </div>
              <div class="sensor-tile-graph" id="tileGraph-${idx}">
                <div class="history-loading" style="padding: 10px 0;">Loading…</div>
              </div>
            </div>`;
        }).join('');

        const startTs = new Date(Date.now() - (24 * 60 * 60 * 1000));

        // Fetch history + render sparklines
        await Promise.all(tiles.map(async (t, idx) => {
          const holder = portal.querySelector(`#tileGraph-${idx}`);
          if (!holder) return;
          try {
            // If we are charting a sensor entity, we can use minimal_response
            // If we are charting attributes from the climate entity, we must request full history to get attributes
            const entityId = t.graphEntity || climateEnt.entity_id;
            const wantAttrs = !t.graphEntity && !!t.attrKey;
            const url = wantAttrs
              ? `history/period/${startTs.toISOString()}?filter_entity_id=${encodeURIComponent(entityId)}`
              : `history/period/${startTs.toISOString()}?filter_entity_id=${encodeURIComponent(entityId)}&minimal_response`;

            const data = await this.hass.callApi('GET', url);
            const series = (Array.isArray(data) && data[0]) ? data[0] : [];
            const pts = parseSeries(series, wantAttrs ? t.attrKey : null);
            const ds = downsample(pts, 80);
            if (!ds.length) {
              holder.innerHTML = '<div class="history-loading" style="padding: 10px 0;">No history</div>';
              return;
            }
            const res = buildSvg(ds, 260, 56);
            holder.innerHTML = res ? res.svg : '<div class="history-loading" style="padding: 10px 0;">No data</div>';
          } catch (e) {
            console.warn('sparkline error', t.key, e);
            holder.innerHTML = '<div class="history-loading" style="padding: 10px 0;">Error</div>';
          }
        }));

      } catch (e) {
        console.error('Failed to mount sensor tiles', e);
      }
    }

    _setupClimatePopupSliders(portal) {
      const tracks = portal.querySelectorAll('.vertical-slider-track');
      const ent = this._getEntity();
      const unit = ent?.attributes?.temperature_unit || this.hass?.config?.unit_system?.temperature || '°';
      tracks.forEach(track => {
        const type = track.dataset.type; // temperature, target_temp_low, target_temp_high

        const update = (e) => {
          this._isDragging = true;
          const rect = track.getBoundingClientRect();
          const y = Math.max(0, Math.min(1, 1 - (e.clientY - rect.top) / rect.height));
          let rawVal = this._tempMin + (y * (this._tempMax - this._tempMin));
          let val = Math.round(rawVal / this._step) * this._step;
          val = Math.round(val * 10) / 10;

          const pct = ((val - this._tempMin) / (this._tempMax - this._tempMin)) * 100;
          const fill = track.querySelector('.vertical-slider-fill');
          const thumb = track.querySelector('.vertical-slider-thumb');
          const display = portal.querySelector(`#display-${type}`);

          if (fill) fill.style.height = `${pct}%`;
          if (thumb) thumb.style.bottom = `calc(${pct}% - 6px)`;
          if (display) display.innerHTML = `${val}<span>${unit}</span>`;

          return val;
        };

        const finish = (e) => {
          const ev = e.changedTouches ? e.changedTouches[0] : e;
          const val = update(ev);
          this._isDragging = false;

          const payload = { entity_id: this._config.entity };
          if (type === 'temperature') payload.temperature = val;
          else if (type === 'target_temp_low') payload.target_temp_low = val;
          else if (type === 'target_temp_high') payload.target_temp_high = val;

          // Validate ranges
          const ent = this._getEntity();
          if (ent && (type === 'target_temp_low' || type === 'target_temp_high')) {
            if (type === 'target_temp_low' && val >= ent.attributes.target_temp_high) return;
            if (type === 'target_temp_high' && val <= ent.attributes.target_temp_low) return;
          }

          this.hass.callService('climate', 'set_temperature', payload);

          document.removeEventListener('mousemove', updateWrapper);
          document.removeEventListener('mouseup', finish);
          document.removeEventListener('touchmove', touchWrapper);
          document.removeEventListener('touchend', finish);
        };

        const updateWrapper = (e) => update(e);
        const touchWrapper = (e) => { e.preventDefault(); update(e.touches[0]); };

        track.addEventListener('mousedown', (e) => {
          updateWrapper(e);
          document.addEventListener('mousemove', updateWrapper);
          document.addEventListener('mouseup', finish);
        });

        track.addEventListener('touchstart', (e) => {
          touchWrapper(e);
          document.addEventListener('touchmove', touchWrapper, { passive: false });
          document.addEventListener('touchend', finish);
        });
      });
    }

    _setupCircularSliderHandlers(portal) {
      const circularSlider = portal.querySelector('#circularSlider');
      if (!circularSlider) return;

      const ent = this._getEntity();
      const unit = ent?.attributes?.temperature_unit || this.hass?.config?.unit_system?.temperature || '°';
      
      // +/- button handlers
      const minusBtn = portal.querySelector('.circular-temp-btn.minus');
      const plusBtn = portal.querySelector('.circular-temp-btn.plus');
      
      if (minusBtn) {
        minusBtn.addEventListener('click', () => {
          const ent = this._getEntity();
          const attrs = ent?.attributes || {};
          const step = this._getTempStep();
          const current = this._optimisticClimateTemp ?? attrs.temperature ?? attrs.current_temperature ?? this._tempMin;
          const newVal = this._clampTemp(current - step);
          
          this._updateCircularSliderUI(portal, newVal, unit);
          
          this.hass.callService('climate', 'set_temperature', { 
            entity_id: this._config.entity, 
            temperature: newVal 
          });
        });
      }
      
      if (plusBtn) {
        plusBtn.addEventListener('click', () => {
          const ent = this._getEntity();
          const attrs = ent?.attributes || {};
          const step = this._getTempStep();
          const current = this._optimisticClimateTemp ?? attrs.temperature ?? attrs.current_temperature ?? this._tempMin;
          const newVal = this._clampTemp(current + step);
          
          this._updateCircularSliderUI(portal, newVal, unit);
          
          this.hass.callService('climate', 'set_temperature', { 
            entity_id: this._config.entity, 
            temperature: newVal 
          });
        });
      }
      
      // Circular slider drag handlers
      const svg = circularSlider.querySelector('.circular-slider-svg');
      const progress = circularSlider.querySelector('#circularProgress');
      const thumb = circularSlider.querySelector('#circularThumb');
      const valueDisplay = circularSlider.querySelector('#circularTempValue');
      
      const maxArcLength = 628.32 * 0.75; // 75% of full circumference (270 degrees)
      
      const updateFromPoint = (clientX, clientY) => {
        this._isDragging = true;
        const rect = svg.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        // Calculate angle from center
        let angle = Math.atan2(clientY - centerY, clientX - centerX);
        
        // Convert to degrees
        let degrees = angle * 180 / Math.PI;
        
        // Normalize to 0-360
        if (degrees < 0) degrees += 360;
        
        // The arc starts at 135 degrees and goes to 405 degrees (135 + 270)
        // Adjust the angle to be relative to the start of the arc
        let arcDegrees = degrees - 135;
        if (arcDegrees < 0) arcDegrees += 360;
        
        // Constrain to 270-degree range
        if (arcDegrees > 270) {
          // Snap to closest end
          if (arcDegrees < 315) {
            arcDegrees = 270; // Snap to end
          } else {
            arcDegrees = 0; // Snap to start
          }
        }
        
        const percentage = (arcDegrees / 270) * 100;
        let rawVal = this._tempMin + (percentage / 100) * (this._tempMax - this._tempMin);
        let val = Math.round(rawVal / this._step) * this._step;
        val = this._clampTemp(val);
        
        const finalPct = ((val - this._tempMin) / (this._tempMax - this._tempMin)) * 100;
        const arcLength = (finalPct / 100) * maxArcLength;
        
        // Calculate thumb position
        const startAngle = 135 * (Math.PI / 180);
        const arcAngle = (finalPct / 100) * 270 * (Math.PI / 180);
        const totalAngle = startAngle + arcAngle;
        const thumbX = 140 + 100 * Math.cos(totalAngle);
        const thumbY = 140 + 100 * Math.sin(totalAngle);
        
        if (progress) progress.setAttribute('stroke-dasharray', `${arcLength} 628.32`);
        if (thumb) {
          thumb.setAttribute('cx', thumbX);
          thumb.setAttribute('cy', thumbY);
        }
        if (valueDisplay) {
          const valueSize = this._config.popup_value_font_size || 64;
          valueDisplay.innerHTML = `${val}<span style="font-size: ${valueSize / 2}px;">${unit}</span>`;
        }
        
        return val;
      };
      
      const finish = (e) => {
        const ev = e.changedTouches ? e.changedTouches[0] : e;
        const val = updateFromPoint(ev.clientX, ev.clientY);
        this._isDragging = false;
        
        this.hass.callService('climate', 'set_temperature', { 
          entity_id: this._config.entity, 
          temperature: val 
        });
        
        document.removeEventListener('mousemove', moveWrapper);
        document.removeEventListener('mouseup', finish);
        document.removeEventListener('touchmove', touchWrapper);
        document.removeEventListener('touchend', finish);
      };
      
      const moveWrapper = (e) => updateFromPoint(e.clientX, e.clientY);
      const touchWrapper = (e) => { 
        e.preventDefault(); 
        updateFromPoint(e.touches[0].clientX, e.touches[0].clientY); 
      };
      
      circularSlider.addEventListener('mousedown', (e) => {
        updateFromPoint(e.clientX, e.clientY);
        document.addEventListener('mousemove', moveWrapper);
        document.addEventListener('mouseup', finish);
      });
      
      circularSlider.addEventListener('touchstart', (e) => {
        updateFromPoint(e.touches[0].clientX, e.touches[0].clientY);
        document.addEventListener('touchmove', touchWrapper, { passive: false });
        document.addEventListener('touchend', finish);
      });
      
      // Setup vertical +/- buttons if they exist
      this._setupVerticalPlusMinusButtons(portal);
    }

    _setupVerticalPlusMinusButtons(portal) {
      let minusBtn = portal.querySelector('.vertical-temp-btn.minus');
      let plusBtn = portal.querySelector('.vertical-temp-btn.plus');

      if (!minusBtn && !plusBtn) return;

      // Prevent duplicate listeners when the popup re-renders
      if (minusBtn && minusBtn.parentNode) {
        const clone = minusBtn.cloneNode(true);
        minusBtn.parentNode.replaceChild(clone, minusBtn);
        minusBtn = clone;
      }
      if (plusBtn && plusBtn.parentNode) {
        const clone = plusBtn.cloneNode(true);
        plusBtn.parentNode.replaceChild(clone, plusBtn);
        plusBtn = clone;
      }

      
      const useGradient = this._config.climate_show_gradient !== false;
      
      if (minusBtn) {
        minusBtn.addEventListener('click', () => {
          const ent = this._getEntity();
          const attrs = ent?.attributes || {};
          const step = this._getTempStep();
          const current = this._optimisticClimateTemp ?? attrs.temperature ?? attrs.current_temperature ?? this._tempMin;
          const unit = attrs.temperature_unit || this.hass?.config?.unit_system?.temperature || '°';
          let newVal = this._clampTemp(current - step);
          this._optimisticClimateTemp = newVal;
          
          // Optimistic UI update
          const percentage = this._getTempPercentage(newVal);
          const color = (HVAC_COLORS && HVAC_COLORS[ent.state]) || HVAC_COLORS.off || 'var(--primary-color)';
          const background = useGradient ? this._getTempGradient() : color;
          
          const fill = portal.querySelector('.vertical-slider-fill');
          const thumb = portal.querySelector('.vertical-slider-thumb');
          const valueDisplay = portal.querySelector('.value-display');
          
          if (fill) {
            fill.style.height = percentage + '%';
            fill.style.background = background;
          }
          if (thumb) thumb.style.bottom = `calc(${percentage}% - 6px)`;
          if (valueDisplay) valueDisplay.innerHTML = `${newVal}<span>${unit}</span>`;
          
          this.hass.callService('climate', 'set_temperature', { 
            entity_id: this._config.entity, 
            temperature: newVal 
          });
        });
      }
      
      if (plusBtn) {
        plusBtn.addEventListener('click', () => {
          const ent = this._getEntity();
          const attrs = ent?.attributes || {};
          const step = this._getTempStep();
          const current = this._optimisticClimateTemp ?? attrs.temperature ?? attrs.current_temperature ?? this._tempMin;
          const unit = attrs.temperature_unit || this.hass?.config?.unit_system?.temperature || '°';
          let newVal = this._clampTemp(current + step);
          this._optimisticClimateTemp = newVal;
          
          // Optimistic UI update
          const percentage = this._getTempPercentage(newVal);
          const color = (HVAC_COLORS && HVAC_COLORS[ent.state]) || HVAC_COLORS.off || 'var(--primary-color)';
          const background = useGradient ? this._getTempGradient() : color;
          
          const fill = portal.querySelector('.vertical-slider-fill');
          const thumb = portal.querySelector('.vertical-slider-thumb');
          const valueDisplay = portal.querySelector('.value-display');
          
          if (fill) {
            fill.style.height = percentage + '%';
            fill.style.background = background;
          }
          if (thumb) thumb.style.bottom = `calc(${percentage}% - 6px)`;
          if (valueDisplay) valueDisplay.innerHTML = `${newVal}<span>${unit}</span>`;
          
          this.hass.callService('climate', 'set_temperature', { 
            entity_id: this._config.entity, 
            temperature: newVal 
          });
        });
      }
    }

    _setupClimatePopupListHandlers(portal, type) {
      portal.querySelectorAll('.list-item').forEach(item => {
        item.addEventListener('click', () => {
          const value = item.dataset.value;
          if (!value) return;

          if (type === 'preset') {
            this.hass.callService('climate', 'set_preset_mode', { entity_id: this._config.entity, preset_mode: value });
          } else if (type === 'fan') {
            this.hass.callService('climate', 'set_fan_mode', { entity_id: this._config.entity, fan_mode: value });
          }
        });
      });
    }



    _renderContent(isOn, brightness, supportsTemp, supportsColor, effectList, currentEffect, isGroup) {
      const valueStyle = `font-size: ${this._config.popup_value_font_size || 36}px; font-weight: ${this._config.popup_value_font_weight || 300};`;
      const labelStyle = `font-size: ${this._config.popup_label_font_size || 16}px; font-weight: ${this._config.popup_label_font_weight || 400};`;
      
      if (this._activeView === 'brightness') {
        const barColor = this._config.dynamic_bar_color ? this._getCurrentColor() : 'linear-gradient(to top, #FFD700, #FFA500)';
        return `
          <div class="value-display" style="${valueStyle}"><span style="${valueStyle}">${brightness}</span><span style="${labelStyle}">%</span></div>
          <div class="vertical-slider-container">
            <div class="vertical-slider-track" id="brightnessTrack">
              <div class="vertical-slider-fill" style="height: ${brightness}%; background: ${barColor}"></div>
              <div class="vertical-slider-thumb" style="bottom: calc(${brightness}% - 6px)"></div>
            </div>
          </div>
        `;
      } else if (this._activeView === 'temperature') {
        const range = this._tempMax - this._tempMin;
        const currentTempPct = 100 - (((this._currentTemp - this._tempMin) / range) * 100);
        const kelvin = Math.round(1000000 / this._currentTemp);
        const tempName = this._getTempName(kelvin);
        return `
          <div class="value-display" style="${labelStyle}">${tempName}</div>
          <div class="vertical-slider-container">
            <div class="vertical-slider-track temp-gradient" id="tempTrackVertical">
              <div class="vertical-slider-fill temp-fill" style="height: ${currentTempPct}%"></div>
              <div class="vertical-slider-thumb" style="bottom: calc(${currentTempPct}% - 6px)"></div>
            </div>
          </div>
          ${this._config.popup_show_favorites !== false ? `
          <button class="save-favorite-fab" id="saveFavoriteBtn" title="Save to Favorites">
            <ha-icon icon="mdi:star-plus"></ha-icon>
          </button>
          ` : ''}
        `;
      } else if (this._activeView === 'color') {
        const colorName = this._getColorName(this._hue, this._saturation);
        return `
          <div class="value-display" style="${labelStyle}">${colorName}</div>
          <div class="color-wheel" id="colorWheel">
            <div class="color-wheel-indicator" id="colorIndicator"></div>
          </div>
          ${this._config.popup_show_favorites !== false ? `
          <button class="save-favorite-fab" id="saveFavoriteBtn" title="Save to Favorites">
            <ha-icon icon="mdi:star-plus"></ha-icon>
          </button>
          ` : ''}
        `;
      }
      
      const view = this._popupPortal ? this._popupPortal.querySelector('[data-view-type]')?.dataset.viewType : null;
      
      if (view === 'scenes') {
        return this._renderFavoritesView();
      } else if (view === 'individual' && isGroup) {
        return this._renderIndividualView();
      } else if (view === 'effects' && effectList.length > 0) {
        return this._renderEffectsView(effectList, currentEffect);
      } else if (view === 'history') {
        return `<div class="timeline-container" data-view-type="history" id="historyContainer">
          <div class="history-loading">Loading Timeline...</div>
        </div>`;
      }

      return '';
    }

    _renderClimateContent(entity) {
        if (this._activeView === 'presets') return this._renderList(entity.attributes.preset_modes, entity.attributes.preset_mode, 'preset');
        if (this._activeView === 'fan') return this._renderList(entity.attributes.fan_modes, entity.attributes.fan_mode, 'fan');
    
        // Main Sliders
        const attrs = entity.attributes;
        const mode = entity.state;
        const color = HVAC_COLORS[mode] || HVAC_COLORS.off;
        const isRange = (mode === 'heat_cool' || mode === 'auto') && attrs.target_temp_high;
        const range = this._tempMax - this._tempMin;
        const borderRadius = this._config.popup_slider_radius ?? 12;
    
        const renderSlider = (id, val, label) => {
            const pct = ((val - this._tempMin) / range) * 100;
            return `
                <div class="climate-slider-group">
                    <div class="value-display" id="disp-${id}">${val}<span>°</span></div>
                    <div class="vertical-slider-container">
                        <div class="vertical-slider-track" id="track-${id}" data-type="${id}">
                            <div class="vertical-slider-fill" style="height: ${pct}%; background: ${color}; border-radius: 0 0 ${borderRadius}px ${borderRadius}px;"></div>
                            <div class="vertical-slider-thumb" style="bottom: calc(${pct}% - 6px)"></div>
                        </div>
                    </div>
                    ${label ? `<div class="climate-label">${label}</div>` : ''}
                </div>`;
        };
    
        if (mode === 'off') return `<div style="opacity:0.5; font-size:24px; font-weight:300;">System is Off</div>`;
        
        if (isRange) {
            return `<div class="climate-dual-wrapper">
                ${renderSlider('low', attrs.target_temp_low, 'Low')}
                ${renderSlider('high', attrs.target_temp_high, 'High')}
            </div>`;
        }
        return renderSlider('single', attrs.temperature || attrs.current_temperature, 'Target');
    }
    
    _renderClimateNav(entity) {
        const modes = entity.attributes.hvac_modes || [];
        const currentMode = this._optimisticHvacMode ?? entity.state;
        const title = (s) => String(s || '')
          .replace(/_/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase());
        return modes.map(m => {
            const isActive = m === currentMode;
            return `
            <button class="nav-btn ${isActive ? 'active' : ''}" id="mode-${m}" style="${isActive ? `color:${HVAC_COLORS[m]}` : ''}">
                <ha-icon icon="${HVAC_ICONS[m]}"></ha-icon>
                ${this._config.popup_hide_button_text ? '' : `<span class="nav-label">${title(m)}</span>`}
            </button>
        `;
        }).join('');
    }


    /* --- COVER POPUP --- */
    _coverFavoritesKey() {
      return `hki_cover_favorites__${this._config.entity}`;
    }

    _ensureCoverFavorites() {
      try {
        const raw = localStorage.getItem(this._coverFavoritesKey());
        this._coverFavorites = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(this._coverFavorites)) this._coverFavorites = [];
      } catch (e) {
        this._coverFavorites = [];
      }
    }

    _persistCoverFavorites() {
      try {
        localStorage.setItem(this._coverFavoritesKey(), JSON.stringify(this._coverFavorites || []));
      } catch (e) {}
    }

    _getCoverPosition(ent) {
      if (!ent) return 0;
      const pos = ent.attributes && ent.attributes.current_position;
      if (typeof pos === 'number') return Math.max(0, Math.min(100, pos));
      if (ent.state === 'open') return 100;
      if (ent.state === 'closed') return 0;
      return 0;
    }

    async _applyCoverFavorite(fav) {
      if (!fav) return;
      try {
        if (Array.isArray(fav.members) && fav.members.length) {
          for (const m of fav.members) {
            if (!m?.entity_id) continue;
            const p = typeof m.position === 'number' ? m.position : 0;
            await this.hass.callService('cover', 'set_cover_position', { entity_id: m.entity_id, position: Math.max(0, Math.min(100, p)) });
          }
          return;
        }
        const position = typeof fav.position === 'number' ? fav.position : null;
        if (position === null) return;
        await this.hass.callService('cover', 'set_cover_position', { entity_id: this._config.entity, position: Math.max(0, Math.min(100, position)) });
      } catch (e) {
        console.error('HKI cover favorite apply failed', e);
      }
    }

    async _promptCoverGroupFavoriteMeta(defaultName) {
      const name = await this._promptText('Favorite name', defaultName || 'Preset');
      if (name === null) return null;
      const color = await this._promptText('Button color (optional)', '');
      if (color === null) return null;
      const image = await this._promptText('Image path/URL (optional)', '');
      if (image === null) return null;
      return { name: name || defaultName || 'Preset', color: color || '', image: image || '' };
    }

    _renderCoverPopupPortal(entity) {
      if (!entity) entity = this._getEntity();
      if (!entity) return;

      if (this._popupPortal) {
        this._popupPortal.remove();
      }

      const isGroup = Array.isArray(entity.attributes?.entity_id) && entity.attributes.entity_id.length > 1;
      const entityName = this._config.name || entity.attributes.friendly_name || this._config.entity;
      const pos = this._getCoverPosition(entity);

      // Use same visual overrides as other popups
      const popupRadius = this._config.popup_border_radius ?? 16;
      const borderRadius = this._config.popup_slider_radius ?? 12;

      const portal = document.createElement('div');
      portal.className = 'hki-light-popup-portal';

      const safeTitle = (s) => String(s || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');

      const controlsIcon = 'mdi:window-shutter';

      const groupBtn = isGroup ? `
        <button class="header-btn" id="coverGroupBtn" title="Group">
          <ha-icon icon="mdi:format-list-bulleted"></ha-icon>
        </button>
      ` : '';

      portal.innerHTML = `
        <style>
          /* Base popup styles (mirrors light/climate popups) */
          .hki-light-popup-portal {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: flex; align-items: center; justify-content: center; z-index: 9999;
          }
          .hki-light-popup-container {
            background: var(--card-background-color, #1c1c1c);
            border-radius: ${popupRadius}px;
            width: 90%; max-width: 400px; height: 600px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
            display: flex; flex-direction: column;
            overflow: hidden;
          }
          .hki-light-popup-header {
            display: flex; justify-content: space-between; align-items: center;
            padding: 16px 20px;
            background: rgba(255, 255, 255, 0.03);
            border-bottom: 1px solid var(--divider-color, rgba(255, 255, 255, 0.05));
            flex-shrink: 0;
          }
          .hki-light-popup-title { display: flex; align-items: center; gap: 12px; flex: 1; }
          .hki-light-popup-title ha-icon { --mdc-icon-size: 24px; }
          .hki-light-popup-title-text {
            display: flex; flex-direction: column; gap: 2px;
            font-size: 16px; font-weight: 500; color: var(--primary-text-color);
          }
          .hki-light-popup-state { font-size: 12px; opacity: 0.6; }
          .hki-light-popup-header-controls { display: flex; gap: 8px; align-items: center; }
          .header-btn {
            width: 40px; height: 40px; border-radius: 50%;
            background: var(--divider-color, rgba(255, 255, 255, 0.05)); border: none;
            color: var(--primary-text-color); cursor: pointer;
            display: flex; align-items: center; justify-content: center;
            transition: all 0.2s;
          }
          .header-btn:hover { background: rgba(255, 255, 255, 0.1); transform: scale(1.05); }
          .header-btn ha-icon { --mdc-icon-size: 20px; }

          .hki-light-popup-tabs {
            display: flex; gap: 8px; padding: 8px 20px;
            background: rgba(255, 255, 255, 0.03);
            border-bottom: 1px solid var(--divider-color, rgba(255, 255, 255, 0.05));
            flex-shrink: 0;
          }
          .hki-light-popup-tab {
            flex: 1; height: 40px; border-radius: 8px;
            background: transparent; border: none;
            color: var(--primary-text-color); cursor: pointer;
            display: flex; align-items: center; justify-content: center; gap: 8px;
            transition: all 0.2s; font-size: 14px; font-weight: 500;
          }
          .hki-light-popup-tab:hover { background: var(--secondary-background-color, rgba(255, 255, 255, 0.08)); }
          .hki-light-popup-tab.active { 
            background: var(--primary-color, rgba(255, 255, 255, 0.15)); 
            color: var(--text-primary-color, var(--primary-text-color));
            box-shadow: inset 0 -2px 0 0 var(--primary-color, rgba(255, 255, 255, 0.5));
          }
          .hki-light-popup-tab ha-icon { --mdc-icon-size: 18px; }

          .hki-light-popup-content {
            flex: 1; padding: 20px; overflow-y: auto; display: flex; flex-direction: column;
            align-items: center; justify-content: center; gap: 12px;
            min-height: 0;
            position: relative;
            overflow-x: hidden;
          }
          .hki-light-popup-content.view-favorites { align-items: stretch; justify-content: flex-start; }

          .hki-light-popup-nav {
            display: flex; justify-content: space-evenly; padding: 12px;
            background: rgba(255, 255, 255, 0.03);
            border-top: 1px solid var(--divider-color, rgba(255, 255, 255, 0.05));
            gap: 8px;
            flex-shrink: 0;
          }
          .nav-btn {
            min-width: 60px; height: 50px; border-radius: 12px;
            border: none; background: transparent;
            color: var(--primary-text-color); opacity: 0.5;
            display: flex; flex-direction: column;
            align-items: center; justify-content: center;
            cursor: pointer; transition: all 0.2s;
            flex: 1;
          }
          .nav-btn:hover { opacity: 1; background: var(--divider-color, rgba(255, 255, 255, 0.05)); }
          .nav-btn:active { background: rgba(255, 255, 255, 0.1); }
          .nav-btn ha-icon { --mdc-icon-size: 24px; margin-bottom: 2px; }
          .nav-btn .nav-label { font-size: 9px; font-weight: 600; text-transform: uppercase; }

          .save-favorite-fab {
            position: absolute; right: 16px; bottom: 16px;
            width: 44px; height: 44px; border-radius: 50%;
            background: rgba(255, 255, 255, 0.08);
            border: 1px solid rgba(255, 255, 255, 0.10);
            color: var(--primary-text-color);
            display: flex; align-items: center; justify-content: center;
            cursor: pointer;
            transition: transform 0.15s, background 0.15s;
            z-index: 5;
          }
          .save-favorite-fab:hover { background: rgba(255, 255, 255, 0.14); transform: scale(1.05); }
          .save-favorite-fab ha-icon { --mdc-icon-size: 20px; }

          .favorites-view { width: 100%; height: 100%; position: relative; }
          .favorites-sticky-header {
            position: sticky; top: 0; z-index: 6;
            display: flex; justify-content: flex-end;
            padding: 8px 0 8px 0;
            background: transparent;
            backdrop-filter: none;
          }
          .favorites-edit-btn {
            position: relative; z-index: 1;
            display: flex; align-items: center; gap: 8px;
            background: var(--divider-color, rgba(255, 255, 255, 0.06));
            border: 1px solid rgba(255, 255, 255, 0.10);
            color: var(--primary-text-color);
            height: 34px; padding: 0 12px; border-radius: 999px;
            cursor: pointer;
          }
          .favorites-edit-btn:hover { background: rgba(255, 255, 255, 0.10); }
          .favorites-edit-btn ha-icon { --mdc-icon-size: 18px; }

          .preset-btn {
            position: relative;
            height: 82px;
            border-radius: 16px;
            background: var(--divider-color, rgba(255, 255, 255, 0.06));
            border: 1px solid rgba(255, 255, 255, 0.08);
            display:flex; flex-direction:column; align-items:center; justify-content:center;
            gap: 8px;
            cursor:pointer;
            overflow:hidden;
          }
          .preset-name {
            font-size: 11px;
            opacity: 0.85;
            max-width: 88%;
            text-align:center;
            overflow:hidden;
            text-overflow: ellipsis;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            line-height: 1.1;
            min-height: 2.2em;
          }
          .preset-picture {
            width: 32px; height: 32px; border-radius: 50%;
            object-fit: cover;
            box-shadow: 0 2px 6px rgba(0,0,0,0.2);
          }
          .fav-delete-badge {
            position: absolute; top: 8px; right: 8px;
            width: 20px; height: 20px; border-radius: 50%;
            background: rgba(255, 255, 255, 0.10);
            border: 1px solid rgba(255, 255, 255, 0.12);
            display: flex; align-items: center; justify-content: center;
            color: var(--primary-text-color);
          }
          .fav-delete-badge:hover { background: rgba(255, 80, 80, 0.25); border-color: rgba(255, 80, 80, 0.35); }
          .fav-delete-badge ha-icon { --mdc-icon-size: 14px; }



          .timeline-container { width: 100%; padding: 0 10px 10px 10px; box-sizing: border-box; overflow: visible; }
          .timeline-item { display: flex; gap: 16px; margin-bottom: 0; min-height: 40px; position: relative; }
          .timeline-time {
            width: 60px; text-align: right; font-size: 12px; color: var(--secondary-text-color);
            padding-top: 2px; flex-shrink: 0; font-family: monospace;
          }
          .timeline-visual {
            display: flex; flex-direction: column; align-items: center; width: 20px; flex-shrink: 0;
          }
          .timeline-dot {
            width: 10px; height: 10px; border-radius: 50%; background: var(--primary-color, #FFD700);
            z-index: 2; border: 2px solid var(--card-background-color, #1c1c1c);
          }
          .timeline-line {
            width: 2px; flex-grow: 1; background: var(--divider-color, rgba(255,255,255,0.1)); margin-top: -2px; margin-bottom: -4px;
          }
          .timeline-item:last-child .timeline-line { display: none; }
          .timeline-content {
            flex: 1; padding-bottom: 16px; font-size: 13px; color: var(--primary-text-color);
          }
          .timeline-detail { font-size: 11px; opacity: 0.6; display: block; margin-top: 4px; }
          .timeline-ago { font-size: 10px; opacity: 0.5; display: block; margin-top: 2px; }
          .timeline-trigger { font-size: 10px; opacity: 0.5; display: block; margin-top: 2px; font-style: italic; }
          .history-loading { width: 100%; text-align: center; padding: 20px; opacity: 0.6; }

          /* Cover-specific */

          /* Shared vertical slider styles (match light/climate) */
          .vertical-slider-container { width: 80px; height: 280px; position: relative; }
          .vertical-slider-track {
            width: 100%; height: 100%; background: var(--secondary-background-color, rgba(255, 255, 255, 0.1));
            border-radius: ${borderRadius}px; position: relative; overflow: hidden; cursor: pointer;
          }
          .vertical-slider-fill {
            position: absolute; bottom: 0; left: 0; right: 0;
            background: rgba(33,150,243,0.85);
            border-radius: 0 0 ${borderRadius}px ${borderRadius}px;
          }
          .vertical-slider-thumb {
            position: absolute; left: 50%; transform: translateX(-50%);
            width: 90px; height: 6px; background: white;
            border-radius: 6px;
            box-shadow: 0 0 0 2px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.3);
            pointer-events: none;
          }
          .hki-cover-content { width: 100%; height: 100%; }
          .cover-controls-wrap { width: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; }
          .cover-slider-wrap { width: 160px; height: 360px; display: flex; flex-direction: column; align-items: center; gap: 12px; }
          .cover-value { font-size: 40px; font-weight: 300; }
          .cover-value span { font-size: 18px; opacity: 0.7; }
          .cover-track { width: 100%; flex: 1; background: rgba(255,255,255,0.10); border-radius: ${borderRadius}px; position: relative; overflow: hidden; cursor: pointer; }
          .cover-fill { position: absolute; left: 0; right: 0; bottom: 0; background: rgba(33,150,243,0.85); }
          .cover-thumb { position: absolute; left: 50%; transform: translateX(-50%); width: 110%; height: 6px; background: #fff; border-radius: 4px; box-shadow: 0 2px 6px rgba(0,0,0,0.30); pointer-events: none; }
          .cover-actions { display: flex; gap: 10px; width: 100%; justify-content: center; }
          .cover-chip { height: 38px; padding: 0 14px; border-radius: 999px; border: 1px solid rgba(255,255,255,0.10); background: rgba(255,255,255,0.06); color: var(--primary-text-color); display:flex; align-items:center; gap:8px; cursor:pointer; }
          .cover-chip:hover { background: rgba(255,255,255,0.10); }

          .cover-members { width: 100%; display: flex; flex-direction: column; gap: 10px; }
          .cover-row { display: flex; align-items: center; gap: 12px; padding: 10px 10px; border-radius: 14px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06); }
          .cover-row-left { display:flex; align-items:center; gap:10px; min-width: 0; flex: 1; }
          .cover-row-name { font-weight: 600; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
          .cover-row-state { font-size: 12px; opacity: 0.65; }
          .cover-row-slider { width: 200px; max-width: 52%; height: 34px; border-radius: 999px; background: rgba(255,255,255,0.08); position: relative; overflow: hidden; cursor: pointer; }
          .cover-row-fill { height: 100%; background: rgba(33,150,243,0.85); }
          .cover-row-thumb { position:absolute; top: 50%; transform: translate(-50%, -50%); width: 10px; height: 22px; border-radius: 8px; background: #fff; box-shadow: 0 2px 6px rgba(0,0,0,0.25); }

          .hki-light-popup-container { border-radius: ${popupRadius}px; }
        </style>
        <div class="hki-light-popup-container">
          <div class="hki-light-popup-header">
            <div class="hki-light-popup-title">
              <ha-icon icon="${controlsIcon}" style="color: rgba(33,150,243,0.95)"></ha-icon>
              <div class="hki-light-popup-title-text">
                ${safeTitle(entityName)}
                <span class="hki-light-popup-state">${pos}%${this._formatLastTriggered(entity) ? ` - ${this._formatLastTriggered(entity)}` : ''}</span>
              </div>
            </div>
            <div class="hki-light-popup-header-controls">
              ${groupBtn}
              <button class="header-btn" id="historyBtn" title="History"><ha-icon icon="mdi:chart-box-outline"></ha-icon></button>
              <button class="header-btn" id="closeBtn" title="Close"><ha-icon icon="mdi:close"></ha-icon></button>
            </div>
          </div>

          <div class="hki-light-popup-tabs">
            ${this._config.popup_show_favorites !== false ? `
              <button class="hki-light-popup-tab ${this._activeView === 'favorites' ? 'active' : ''}" id="coverTabFavorites" style="${this._activeView === 'favorites' ? this._getPopupButtonStyle(true) : this._getPopupButtonStyle(false)}">
                <ha-icon icon="mdi:star"></ha-icon> Favorites
              </button>
            ` : ''}
            <button class="hki-light-popup-tab ${this._activeView !== 'favorites' ? 'active' : ''}" id="coverTabControls" style="${this._activeView !== 'favorites' ? this._getPopupButtonStyle(true) : this._getPopupButtonStyle(false)}">
              <ha-icon icon="mdi:tune-vertical"></ha-icon> Controls
            </button>
          </div>

          <div class="hki-light-popup-content ${this._activeView === 'favorites' ? 'view-favorites' : ''}">
            <div class="hki-cover-content">
              ${this._renderCoverPopupContent(entity)}
            </div>
          </div>

          <div class="hki-light-popup-nav">
            <button class="nav-btn" id="coverOpen" style="${this._getPopupButtonStyle(false)}"><ha-icon icon="mdi:arrow-up"></ha-icon>${this._config.popup_hide_button_text ? '' : '<span class="nav-label">Open</span>'}</button>
            <button class="nav-btn" id="coverStop" style="${this._getPopupButtonStyle(false)}"><ha-icon icon="mdi:stop"></ha-icon>${this._config.popup_hide_button_text ? '' : '<span class="nav-label">Stop</span>'}</button>
            <button class="nav-btn" id="coverClose" style="${this._getPopupButtonStyle(false)}"><ha-icon icon="mdi:arrow-down"></ha-icon>${this._config.popup_hide_button_text ? '' : '<span class="nav-label">Close</span>'}</button>
</div>
        </div>
      `;

      document.body.appendChild(portal);
      this._popupPortal = portal;
      this._setupCoverPopupHandlers(portal);

      // If history is active (header button), load it
      if (this._coverHistoryOpen) {
        this._loadHistory();
      }
    }

    _renderCoverPopupContent(entity) {
      const borderRadius = this._config.popup_slider_radius ?? 12;
      const isGroup = Array.isArray(entity.attributes?.entity_id) && entity.attributes.entity_id.length > 1;
      if (this._coverHistoryOpen) {
        return `<div class="timeline-container" data-view-type="history" id="historyContainer"><div class="history-loading">Loading Timeline...</div></div>`;
      }

      if (this._coverGroupMode && isGroup) {
        const rows = entity.attributes.entity_id.map((id) => {
          const st = this.hass.states[id];
          if (!st) return '';
          const p = this._getCoverPosition(st);
          const name = (st.attributes?.friendly_name) || id;
          return `
            <div class="cover-row" data-entity-id="${id}">
              <div class="cover-row-left">
                <button class="header-btn" style="width:38px;height:38px;"><ha-icon icon="mdi:window-shutter"></ha-icon></button>
                <div style="display:flex;flex-direction:column;min-width:0;">
                  <div class="cover-row-name">${name}</div>
                  <div class="cover-row-state">${p}%</div>
                </div>
              </div>
              <div class="cover-row-slider" data-slider="pos">
                <div class="cover-row-fill" style="width:${p}%"></div>
                <div class="cover-row-thumb" style="left:${p}%"></div>
              </div>
            </div>
          `;
        }).join('');

        return `
          <div class="cover-members" data-view-type="cover-individual">
            ${rows}
          </div>
          ${this._config.popup_show_favorites !== false ? `<button class="save-favorite-fab" id="coverGroupSave" title="Save favorite"><ha-icon icon="mdi:star-plus"></ha-icon></button>` : ''}
        `;
      }

      if (this._activeView === 'favorites') {
        const favs = Array.isArray(this._coverFavorites) ? this._coverFavorites : [];
        if (favs.length === 0) {
          return `<div style="padding: 18px; text-align:center; opacity:0.6;">No favorites yet</div>`;
        }
        const tiles = favs.map((f, idx) => {
          const label = (f && f.name) ? f.name : `Preset ${idx + 1}`;
          const color = f.color || 'rgba(255,255,255,0.12)';
          const pic = f.image ? `<img class="preset-picture" src="${f.image}" alt="" />` : `<div class="preset-icon" style="width:32px;height:32px;border-radius:50%;background:${color};"></div>`;
          const del = (this._coverEditMode ? `<div class="fav-delete-badge" data-del="${idx}"><ha-icon icon="mdi:close"></ha-icon></div>` : '');
          return `
            <div class="preset-btn" data-idx="${idx}" style="position:relative;">
              ${del}
              ${pic}
              <div class="preset-name">${label}</div>
            </div>
          `;
        }).join('');

        return `
          <div class="favorites-view">
            <div class="favorites-sticky-header">
              <button class="favorites-edit-btn" id="coverFavEdit"><ha-icon icon="mdi:pencil"></ha-icon> Edit</button>
            </div>
            <div class="favorites-grid" style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;">
              ${tiles}
            </div>
          </div>
        `;
      }

      // Controls view
      const pos = this._getCoverPosition(entity);
      // Clamp thumb so it is always visible (at 0% it would otherwise be rendered outside the track)
      const thumbBottom = (pos <= 0) ? '0px' : `calc(${pos}% - 6px)`;
      return `
        <div class="cover-controls-wrap">
          <div class="cover-slider-wrap">
            <div class="cover-value" id="coverPosDisp" style="font-size:${this._config.popup_value_font_size ?? 36}px; font-weight:${this._config.popup_value_font_weight ?? 300};">${pos}<span>%</span></div>
            <div class="vertical-slider-container">
              <div class="vertical-slider-track" id="coverPosTrack">
                <div class="vertical-slider-fill" style="height:${pos}%;"></div>
              <div class="vertical-slider-thumb" style="bottom:${thumbBottom}"></div>
              </div>
            </div>
            <div style="opacity:0.55; letter-spacing:0.08em; font-size:${this._config.popup_label_font_size ?? 16}px; font-weight:${this._config.popup_label_font_weight ?? 400};">POSITION</div>
          </div>
</div>
        ${this._config.popup_show_favorites !== false ? `<button class="save-favorite-fab" id="coverSave" title="Save favorite"><ha-icon icon="mdi:star-plus"></ha-icon></button>` : ''}
      `;
    }

    _setupCoverPopupHandlers(portal) {
      const closeBtn = portal.querySelector('#closeBtn');
      if (closeBtn) closeBtn.addEventListener('click', () => this._closePopup());

      const historyBtn = portal.querySelector('#historyBtn');
      if (historyBtn) {
        historyBtn.addEventListener('click', () => {
          this._coverHistoryOpen = !this._coverHistoryOpen;
          this._renderCoverPopupPortal(this._getEntity());
        });
      }

      const groupBtn = portal.querySelector('#coverGroupBtn');
      if (groupBtn) {
        groupBtn.addEventListener('click', () => {
          this._coverGroupMode = !this._coverGroupMode;
          this._coverHistoryOpen = false;
          this._renderCoverPopupPortal(this._getEntity());
        });
      }

      const tabFav = portal.querySelector('#coverTabFavorites');
      if (tabFav) tabFav.addEventListener('click', () => { this._activeView = 'favorites'; this._coverHistoryOpen = false; this._renderCoverPopupPortal(this._getEntity()); });
      const tabCtl = portal.querySelector('#coverTabControls');
      if (tabCtl) tabCtl.addEventListener('click', () => { this._activeView = 'controls'; this._coverHistoryOpen = false; this._renderCoverPopupPortal(this._getEntity()); });

      const openBtn = portal.querySelector('#coverOpen');
      if (openBtn) openBtn.addEventListener('click', () => this.hass.callService('cover', 'open_cover', { entity_id: this._config.entity }));
      const stopBtn = portal.querySelector('#coverStop');
      if (stopBtn) stopBtn.addEventListener('click', () => this.hass.callService('cover', 'stop_cover', { entity_id: this._config.entity }));
      const closeBtn2 = portal.querySelector('#coverClose');
      if (closeBtn2) closeBtn2.addEventListener('click', () => this.hass.callService('cover', 'close_cover', { entity_id: this._config.entity }));

      const groupSave = portal.querySelector('#coverGroupSave');
      if (groupSave) {
        groupSave.addEventListener('click', async () => {
          const ent = this._getEntity();
          if (!ent) return;
          const members = (ent.attributes?.entity_id || []).map((id) => {
            const st = this.hass.states[id];
            return { entity_id: id, position: this._getCoverPosition(st) };
          });
          const meta = await this._promptCoverGroupFavoriteMeta(ent.attributes?.friendly_name || 'Group preset');
          if (!meta) return;
          const fav = { name: meta.name, members, color: meta.color, image: meta.image };
          this._coverFavorites = Array.isArray(this._coverFavorites) ? this._coverFavorites : [];
          this._coverFavorites.unshift(fav);
          this._persistCoverFavorites();
          this._activeView = 'favorites';
          this._coverGroupMode = false;
          this._renderCoverPopupPortal(this._getEntity());
        });
      }



      const coverSave = portal.querySelector('#coverSave');
      if (coverSave) {
        coverSave.addEventListener('click', async () => {
          const ent = this._getEntity();
          if (!ent) return;
          const position = this._getCoverPosition(ent);
          const meta = await this._promptCoverGroupFavoriteMeta(position + '%');
          if (!meta) return;
          const fav = { name: meta.name, position, color: meta.color, image: meta.image };
          this._coverFavorites = Array.isArray(this._coverFavorites) ? this._coverFavorites : [];
          this._coverFavorites.unshift(fav);
          this._persistCoverFavorites();
          this._activeView = 'favorites';
          this._coverGroupMode = false;
          this._renderCoverPopupPortal(this._getEntity());
        });
      }
      const editBtn = portal.querySelector('#coverFavEdit');
      if (editBtn) {
        editBtn.addEventListener('click', () => {
          this._coverEditMode = !this._coverEditMode;
          this._renderCoverPopupPortal(this._getEntity());
        });
      }

      // Favorites click / delete
      portal.querySelectorAll('.preset-btn').forEach((el) => {
        el.addEventListener('click', async (e) => {
          const del = e.target.closest('[data-del]');
          if (del) {
            const idx = parseInt(del.getAttribute('data-del'));
            if (!Number.isNaN(idx)) {
              this._coverFavorites.splice(idx, 1);
              this._persistCoverFavorites();
              this._renderCoverPopupPortal(this._getEntity());
            }
            e.stopPropagation();
            return;
          }
          const idx = parseInt(el.getAttribute('data-idx'));
          const fav = this._coverFavorites[idx];
          await this._applyCoverFavorite(fav);
        });
      });

      // Main position slider
      const track = portal.querySelector('#coverPosTrack');
      if (track) {
        const applyVisual = (val) => {
          const fill = track.querySelector('.vertical-slider-fill');
          const thumb = track.querySelector('.vertical-slider-thumb');
          const disp = portal.querySelector('#coverPosDisp');
          if (fill) fill.style.height = `${val}%`;
          if (thumb) thumb.style.bottom = (val <= 0) ? '0px' : `calc(${val}% - 6px)`;
          if (disp) disp.innerHTML = `${val}<span>%</span>`;
        };
        const calcVal = (clientY) => {
          const rect = track.getBoundingClientRect();
          const pct = 1 - ((clientY - rect.top) / rect.height);
          return Math.round(Math.max(0, Math.min(1, pct)) * 100);
        };
        let dragging = false;
        const onMove = (e) => {
          if (!dragging) return;
          const y = (e.touches && e.touches[0]) ? e.touches[0].clientY : e.clientY;
          applyVisual(calcVal(y));
        };
        const onUp = async (e) => {
          if (!dragging) return;
          dragging = false;
          document.removeEventListener('mousemove', onMove);
          document.removeEventListener('mouseup', onUp);
          document.removeEventListener('touchmove', onMove);
          document.removeEventListener('touchend', onUp);
          const y = (e.changedTouches && e.changedTouches[0]) ? e.changedTouches[0].clientY : e.clientY;
          const v = calcVal(y);
          applyVisual(v);
          await this.hass.callService('cover', 'set_cover_position', { entity_id: this._config.entity, position: v });
        };
        const onDown = (e) => {
          dragging = true;
          const y = (e.touches && e.touches[0]) ? e.touches[0].clientY : e.clientY;
          applyVisual(calcVal(y));
          document.addEventListener('mousemove', onMove);
          document.addEventListener('mouseup', onUp);
          document.addEventListener('touchmove', onMove, { passive: true });
          document.addEventListener('touchend', onUp);
        };
        track.addEventListener('mousedown', onDown);
        track.addEventListener('touchstart', onDown, { passive: true });
      }

      // Group row sliders
      portal.querySelectorAll('.cover-row').forEach((row) => {
        const entityId = row.getAttribute('data-entity-id');
        const slider = row.querySelector('.cover-row-slider');
        if (!entityId || !slider) return;
        const applyVisual = (pct) => {
          const fill = slider.querySelector('.cover-row-fill');
          const thumb = slider.querySelector('.cover-row-thumb');
          if (fill) fill.style.width = `${pct}%`;
          if (thumb) thumb.style.left = `${pct}%`;
          const st = row.querySelector('.cover-row-state');
          if (st) st.textContent = `${pct}%`;
        };
        const calcPct = (clientX) => {
          const rect = slider.getBoundingClientRect();
          const pct = ((clientX - rect.left) / rect.width) * 100;
          return Math.round(Math.max(0, Math.min(100, pct)));
        };
        let dragging = false;
        const onMove = (e) => {
          if (!dragging) return;
          const x = (e.touches && e.touches[0]) ? e.touches[0].clientX : e.clientX;
          applyVisual(calcPct(x));
        };
        const onUp = async (e) => {
          if (!dragging) return;
          dragging = false;
          document.removeEventListener('mousemove', onMove);
          document.removeEventListener('mouseup', onUp);
          document.removeEventListener('touchmove', onMove);
          document.removeEventListener('touchend', onUp);
          const x = (e.changedTouches && e.changedTouches[0]) ? e.changedTouches[0].clientX : e.clientX;
          const pct = calcPct(x);
          applyVisual(pct);
          await this.hass.callService('cover', 'set_cover_position', { entity_id: entityId, position: pct });
        };
        const onDown = (e) => {
          dragging = true;
          const x = (e.touches && e.touches[0]) ? e.touches[0].clientX : e.clientX;
          applyVisual(calcPct(x));
          document.addEventListener('mousemove', onMove);
          document.addEventListener('mouseup', onUp);
          document.addEventListener('touchmove', onMove, { passive: true });
          document.addEventListener('touchend', onUp);
        };
        slider.addEventListener('mousedown', onDown);
        slider.addEventListener('touchstart', onDown, { passive: true });
      });

      // If history view, load content
      if (this._coverHistoryOpen) {
        this._loadHistory();
      }
    }


    /* ------------------------------------------------------------------
     * Alarm Control Panel Popup (Alarmo)
     * ------------------------------------------------------------------ */
    _renderAlarmPopupPortal(entity) {
      if (!entity) entity = this._getEntity();
      if (!entity) return;

      if (this._popupPortal) this._popupPortal.remove();

      const entityName = this._config.name || entity.attributes.friendly_name || this._config.entity;
      const state = entity.state || 'unknown';
      const popupRadius = this._config.popup_border_radius ?? 16;

      const icon = (state === 'disarmed') ? 'mdi:shield-check' : 'mdi:shield-lock';
      const iconColor = (state === 'disarmed') ? '#4CAF50' : '#F44336';

      const portal = document.createElement('div');
      portal.className = 'hki-light-popup-portal';

      const safeTitle = (t) => String(t || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');

      portal.innerHTML = `
        <style>
          /* Reuse the same base popup styling as other HKI popups */
          .hki-light-popup-portal {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: flex; align-items: center; justify-content: center; z-index: 9999;
          }
          .hki-light-popup-container {
            background: var(--card-background-color, #1c1c1c);
            border-radius: ${popupRadius}px;
            width: 90%; max-width: 400px; height: 600px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
            display: flex; flex-direction: column;
            overflow: hidden;
          }
          .hki-light-popup-header {
            display: flex; justify-content: space-between; align-items: center;
            padding: 16px 20px;
            background: rgba(255, 255, 255, 0.03);
            border-bottom: 1px solid var(--divider-color, rgba(255, 255, 255, 0.05));
            flex-shrink: 0;
          }
          .hki-light-popup-title { display: flex; align-items: center; gap: 12px; flex: 1; }
          .hki-light-popup-title ha-icon { --mdc-icon-size: 24px; }
          .hki-light-popup-title-text {
            display: flex; flex-direction: column; gap: 2px;
            font-size: 16px; font-weight: 500; color: var(--primary-text-color);
          }
          .hki-light-popup-state { font-size: 12px; opacity: 0.6; text-transform: capitalize; }
          .hki-light-popup-header-controls { display: flex; gap: 8px; align-items: center; }
          .header-btn {
            width: 40px; height: 40px; border-radius: 50%;
            background: var(--divider-color, rgba(255, 255, 255, 0.05)); border: none;
            color: var(--primary-text-color); cursor: pointer;
            display: flex; align-items: center; justify-content: center;
            transition: all 0.2s;
          }
          .header-btn:hover { background: rgba(255, 255, 255, 0.1); transform: scale(1.05); }
          .header-btn ha-icon { --mdc-icon-size: 20px; }

          .hki-light-popup-body { flex: 1; display:flex; align-items:center; justify-content:center; padding: 18px 20px; box-sizing: border-box; overflow: hidden; }
          .hki-alarm-content { width: 100%; height: 100%; display:flex; flex-direction:column; align-items:center; justify-content:center; }

          /* Code display */
          .alarm-code-wrapper { height: 40px; display:flex; align-items:center; justify-content:center; margin-bottom: 22px; width: 100%; }
          .alarm-code-placeholder { font-size: 13px; opacity: 0.3; letter-spacing: 1px; text-transform: uppercase; }
          .alarm-code-dots { display:flex; gap: 12px; height: 14px; align-items:center; }
          .alarm-code-dot { 
            width: 12px; height: 12px; border-radius: 50%; 
            background: var(--primary-text-color); 
            box-shadow: 0 0 10px var(--primary-color, rgba(255,255,255,0.3)); 
          }

          /* --- Code feedback (wrong/right) --- */
          .alarm-code-wrapper.is-error { animation: hkiShake 0.35s ease-in-out; }
          .alarm-code-wrapper.is-error .alarm-code-dot {
            background: #F44336;
            box-shadow: 0 0 12px rgba(244,67,54,0.55);
          }
          
          .alarm-code-wrapper.is-success .alarm-code-dot {
            background: #4CAF50;
            box-shadow: 0 0 12px rgba(76,175,80,0.55);
          }
          
          /* shake animation */
          @keyframes hkiShake {
            0% { transform: translateX(0); }
            15% { transform: translateX(-8px); }
            30% { transform: translateX(8px); }
            45% { transform: translateX(-6px); }
            60% { transform: translateX(6px); }
            75% { transform: translateX(-4px); }
            100% { transform: translateX(0); }
          }

          /* Keypad */
          .alarm-keypad { display:grid; grid-template-columns: repeat(3, 1fr); row-gap: 16px; column-gap: 24px; width: 100%; max-width: 280px; }
          .alarm-key {
            width: 72px; height: 72px; border-radius: 50%; border: none;
            background: var(--secondary-background-color, rgba(255,255,255,0.06));
            border: 2px solid var(--divider-color, rgba(255, 255, 255, 0.1));
            color: var(--primary-text-color); font-size: 26px; font-weight: 300;
            cursor: pointer; justify-self: center;
            display:flex; align-items:center; justify-content:center;
            transition: all 0.15s ease-out;
            user-select: none; -webkit-tap-highlight-color: transparent;
          }
          .alarm-key:active { background: rgba(255,255,255,0.2); transform: scale(0.95); }
          .alarm-key.action { background: transparent; font-size: 16px; font-weight: 600; color: var(--secondary-text-color, rgba(255,255,255,0.6)); }

          /* Bottom nav matches alarmo popup look */
          .hki-alarm-nav { display: flex; justify-content: space-evenly; padding: 12px; background: rgba(255, 255, 255, 0.03); border-top: 1px solid var(--divider-color, rgba(255, 255, 255, 0.05)); gap: 8px; flex-shrink: 0; }
          .alarm-nav-btn {
            width: 60px; height: 50px; border-radius: 12px; border: none;
            background: transparent; color: var(--primary-text-color);
            opacity: 0.5; display:flex; flex-direction:column; align-items:center; justify-content:center;
            cursor:pointer; transition: all 0.3s;
          }
          .alarm-nav-btn:hover { opacity: 1; background: rgba(255,255,255,0.05); }
          .alarm-nav-btn ha-icon { --mdc-icon-size: 24px; margin-bottom: 2px; }
          .alarm-nav-btn span { font-size: 9px; font-weight: 600; text-transform: uppercase; }
          .alarm-nav-btn.active { 
            opacity: 1; 
            background: var(--primary-color, rgba(255,255,255,0.10));
            color: var(--text-primary-color, var(--primary-text-color));
          }
          .alarm-nav-btn.active.disarm { color: #4CAF50; }
          .alarm-nav-btn.active.home { color: #FF9800; }
          .alarm-nav-btn.active.away { color: #F44336; }
          .alarm-nav-btn.active.night { color: #FF9800; }

          /* Timeline styles (shared look with other popups) */
          .timeline-container { width: 100%; padding: 0 10px 10px 10px; box-sizing: border-box; overflow: visible; }
          .history-loading { padding: 40px 20px; text-align: center; opacity: 0.6; font-size: 14px; }
          .timeline-item { display: flex; gap: 12px; padding: 14px 0; align-items: flex-start; position: relative; min-height: 50px; }
          .timeline-time { width: 55px; text-align: right; font-size: 12px; opacity: 0.6; flex-shrink: 0; padding-top: 2px; }
          .timeline-visual { position: absolute; left: 67px; width: 16px; display: flex; justify-content: center; flex-shrink: 0; top: 0; bottom: 0; }
          .timeline-dot { width: 10px; height: 10px; border-radius: 50%; margin-top: 17px; position: relative; z-index: 2; }
          .timeline-line { position: absolute; top: 27px; bottom: 0; width: 2px; background: var(--divider-color, rgba(255,255,255,0.12)); left: 50%; transform: translateX(-50%); z-index: 1; }
          .timeline-item:last-child .timeline-line { display: none; }
          .timeline-content { display: flex; flex-direction: column; gap: 2px; min-width: 0; padding-left: 95px; }
          .timeline-ago { font-size: 11px; opacity: 0.6; }
          .timeline-trigger { font-size: 11px; opacity: 0.45; font-style: italic; }

          /* History view container scrolling */
          .alarm-history-scroll { width:100%; height:100%; overflow:auto; padding: 6px 6px 0 6px; box-sizing: border-box; }
        </style>

        <div class="hki-light-popup-container">
          <div class="hki-light-popup-header">
            <div class="hki-light-popup-title">
              <ha-icon icon="${icon}" style="color:${iconColor}"></ha-icon>
              <div class="hki-light-popup-title-text">
                ${safeTitle(entityName)}
                <span class="hki-light-popup-state">${String(state).replace(/_/g,' ')}${this._formatLastTriggered(entity) ? ` - ${this._formatLastTriggered(entity)}` : ''}</span>
              </div>
            </div>
            <div class="hki-light-popup-header-controls">
              <button class="header-btn" id="alarmHistoryBtn" title="History"><ha-icon icon="mdi:chart-box-outline"></ha-icon></button>
              <button class="header-btn" id="closeBtn" title="Close"><ha-icon icon="mdi:close"></ha-icon></button>
            </div>
          </div>

          <div class="hki-light-popup-body" id="alarmBody">
            ${this._renderAlarmPopupContent(entity)}
          </div>

          <div class="hki-alarm-nav" id="alarmBottomNav">
            <button class="alarm-nav-btn disarm ${state === 'disarmed' ? 'active' : ''}" id="btnDisarm" style="${state === 'disarmed' ? this._getPopupButtonStyle(true) : this._getPopupButtonStyle(false)}">
              <ha-icon icon="mdi:lock-open-variant"></ha-icon>${this._config.popup_hide_button_text ? '' : '<span>Disarm</span>'}
            </button>
            <button class="alarm-nav-btn home ${state === 'armed_home' ? 'active' : ''}" id="btnHome" style="${state === 'armed_home' ? this._getPopupButtonStyle(true) : this._getPopupButtonStyle(false)}">
              <ha-icon icon="mdi:home-lock"></ha-icon>${this._config.popup_hide_button_text ? '' : '<span>Home</span>'}
            </button>
            <button class="alarm-nav-btn away ${state === 'armed_away' ? 'active' : ''}" id="btnAway" style="${state === 'armed_away' ? this._getPopupButtonStyle(true) : this._getPopupButtonStyle(false)}">
              <ha-icon icon="mdi:lock"></ha-icon>${this._config.popup_hide_button_text ? '' : '<span>Away</span>'}
            </button>
            <button class="alarm-nav-btn night ${state === 'armed_night' ? 'active' : ''}" id="btnNight" style="${state === 'armed_night' ? this._getPopupButtonStyle(true) : this._getPopupButtonStyle(false)}">
              <ha-icon icon="mdi:weather-night"></ha-icon>${this._config.popup_hide_button_text ? '' : '<span>Night</span>'}
            </button>
          </div>
        </div>
      `;

      document.body.appendChild(portal);
      this._popupPortal = portal;
      this._setupAlarmPopupHandlers(portal);

      if (this._alarmHistoryOpen) this._loadHistory();
    }

    _renderAlarmPopupContent(entity) {
      if (this._alarmHistoryOpen) {
        return `
          <div class="alarm-history-scroll">
            <div class="timeline-container" data-view-type="history" id="historyContainer">
              <div class="history-loading">Loading Timeline...</div>
            </div>
          </div>
        `;
      }

      const code = String(this._alarmCodeInput || '');
      const dots = code.length > 0
        ? `<div class="alarm-code-dots">${Array.from({length: code.length}).map(()=>'<div class="alarm-code-dot"></div>').join('')}</div>`
        : `<span class="alarm-code-placeholder">Enter Code</span>`;

      return `
        <div class="hki-alarm-content" data-view-type="main">
          <div class="alarm-code-wrapper" id="alarmCodeWrapper">${dots}</div>
          <div class="alarm-keypad">
            ${[1,2,3,4,5,6,7,8,9].map(n => `<button class="alarm-key" data-key="${n}">${n}</button>`).join('')}
            <button class="alarm-key action" data-key="clear">CLR</button>
            <button class="alarm-key" data-key="0">0</button>
            <div style="width:72px;"></div>
          </div>
        </div>
      `;
    }

    _setupAlarmPopupHandlers(portal) {
      const closeBtn = portal.querySelector('#closeBtn');
      if (closeBtn) closeBtn.addEventListener('click', () => this._closePopup());

      const historyBtn = portal.querySelector('#alarmHistoryBtn');
      if (historyBtn) {
        historyBtn.addEventListener('click', () => {
          this._alarmHistoryOpen = !this._alarmHistoryOpen;
          // When opening history, render and then load
          this._renderAlarmPopupPortal(this._getEntity());
          if (this._alarmHistoryOpen) setTimeout(() => this._loadHistory(), 50);
        });
      }

      // keypad (only in main view)
      portal.querySelectorAll('.alarm-key').forEach((b) => {
        b.addEventListener('click', (e) => {
          const k = e.currentTarget?.dataset?.key;
          if (!k) return;
          if (k === 'clear') this._alarmCodeInput = '';
          else this._alarmCodeInput = `${this._alarmCodeInput || ''}${k}`;
          // update just the code wrapper
          const w = portal.querySelector('#alarmCodeWrapper');
          if (w) {
            const code = String(this._alarmCodeInput || '');
            w.innerHTML = code.length > 0
              ? `<div class="alarm-code-dots">${Array.from({length: code.length}).map(()=>'<div class="alarm-code-dot"></div>').join('')}</div>`
              : `<span class="alarm-code-placeholder">Enter Code</span>`;
          }
        });
      });

      const doAction = async (service) => {
        const entityId = this._config.entity;
        if (!entityId) return;
      
        const data = { entity_id: entityId };
        const code = String(this._alarmCodeInput || '').trim();
        if (code) data.code = code;
      
        const wrapper = portal.querySelector('#alarmCodeWrapper');
      
        const flash = (cls) => {
          if (!wrapper) return;
          wrapper.classList.remove('is-error', 'is-success');
          // force reflow so the animation triggers every time
          void wrapper.offsetWidth;
          wrapper.classList.add(cls);
          setTimeout(() => wrapper.classList.remove(cls), 500);
        };
      
        try {
          await this.hass.callService('alarm_control_panel', service, data);
      
          // ✅ correct (or accepted) -> glow green then close popup
          flash('is-success');
          this._alarmCodeInput = '';
          setTimeout(() => this._closePopup(), 350);
      
        } catch (e) {
          // ❌ wrong code -> glow red + shake, then clear input
          console.warn('Alarm service call failed', e);
          flash('is-error');
      
          setTimeout(() => {
            this._alarmCodeInput = '';
            if (wrapper) {
              wrapper.innerHTML = `<span class="alarm-code-placeholder">Enter Code</span>`;
            }
          }, 350);
      
          // keep popup open; optionally re-render after a short delay if you want state refresh
          // setTimeout(() => this._renderAlarmPopupPortal(this._getEntity()), 250);
        }
      };

      const btnDisarm = portal.querySelector('#btnDisarm');
      if (btnDisarm) btnDisarm.addEventListener('click', () => doAction('alarm_disarm'));
      const btnHome = portal.querySelector('#btnHome');
      if (btnHome) btnHome.addEventListener('click', () => doAction('alarm_arm_home'));
      const btnAway = portal.querySelector('#btnAway');
      if (btnAway) btnAway.addEventListener('click', () => doAction('alarm_arm_away'));
      const btnNight = portal.querySelector('#btnNight');
      if (btnNight) btnNight.addEventListener('click', () => doAction('alarm_arm_night'));
    }



    /**
     * Humidifier Popup
     */
    /**
     * Humidifier Popup
     */
    _renderHumidifierPopupPortal(entity) {
      if (this._popupPortal) this._popupPortal.remove();
      if (!entity) return;

      const name = this._config.name || entity.attributes.friendly_name || this._config.entity;
      const attrs = entity.attributes || {};
      const state = entity.state;
      const isOn = state === 'on';
      const currentHumidity = attrs.current_humidity || 0;
      const targetHumidity = attrs.humidity || 50;
      const minHumidity = attrs.min_humidity || 0;
      const maxHumidity = attrs.max_humidity || 100;
      const modes = attrs.available_modes || [];
      const currentMode = attrs.mode || 'normal';
      
      const color = isOn ? 'var(--primary-color, #03a9f4)' : 'var(--disabled-text-color, #6f6f6f)';
      const icon = isOn ? 'mdi:air-humidifier' : 'mdi:air-humidifier-off';
      const borderRadius = this._config.popup_slider_radius ?? 12;

      const valueSize = this._config.popup_value_font_size || 36;
      const valueWeight = this._config.popup_value_font_weight || 300;

      const portal = document.createElement('div');
      portal.className = 'hki-popup-portal';

      portal.innerHTML = `
        <style>
          .hki-popup-portal {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.7);
            display: flex; align-items: center; justify-content: center; z-index: 9999;
          }
          .hki-popup-container {
            background: var(--card-background-color, #1c1c1c);
            border-radius: 16px;
            width: 90%; max-width: 400px; height: 600px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
            display: flex; flex-direction: column; overflow: hidden;
          }
          .hki-popup-header {
            display: flex; justify-content: space-between; align-items: center; padding: 16px 20px;
            background: rgba(255, 255, 255, 0.03); border-bottom: 1px solid var(--divider-color, rgba(255, 255, 255, 0.05));
            flex-shrink: 0;
          }
          .hki-popup-title { display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0; }
          .hki-popup-title ha-icon { --mdc-icon-size: 24px; }
          .hki-popup-title-text { display: flex; flex-direction: column; gap: 2px; font-size: 16px; font-weight: 500; min-width: 0; }
          .hki-popup-state { font-size: 12px; opacity: 0.6; text-transform: capitalize; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
          .hki-popup-header-controls { display: flex; gap: 8px; align-items: center; }
          .header-btn {
            width: 40px; height: 40px; border-radius: 50%;
            background: var(--divider-color, rgba(255, 255, 255, 0.05)); border: none;
            color: var(--primary-text-color); cursor: pointer;
            display: flex; align-items: center; justify-content: center;
            transition: all 0.2s;
          }
          .header-btn:hover { background: rgba(255, 255, 255, 0.1); transform: scale(1.05); }
          .header-btn ha-icon { --mdc-icon-size: 20px; }

          .hki-tabs {
            display: flex; gap: 8px; padding: 8px 20px;
            background: rgba(255, 255, 255, 0.02);
            border-bottom: 1px solid var(--divider-color, rgba(255, 255, 255, 0.05));
            flex-shrink: 0;
          }
          .tab-btn {
            flex: 1; height: 40px; border-radius: 8px;
            background: transparent; border: 1px solid var(--divider-color, rgba(255,255,255,0.1));
            color: var(--primary-text-color); cursor: pointer;
            display: flex; align-items: center; justify-content: center; gap: 8px;
            transition: all 0.2s; font-size: 14px; font-weight: 500;
          }
          .tab-btn:hover { background: var(--secondary-background-color, rgba(255,255,255,0.08)); }
          .tab-btn.active { 
            background: var(--primary-color, rgba(255,255,255,0.12)); 
            border-color: transparent; 
            color: var(--text-primary-color, var(--primary-text-color));
          }

          .hki-popup-content { flex: 1; padding: 20px; overflow-y: auto; display: flex; align-items: center; justify-content: center; min-height: 0; }
          
          .slider-with-buttons {
            display: flex; align-items: center; justify-content: center; width: 100%;
            position: relative;
          }
          .humidifier-current-display {
            display: flex; flex-direction: column; align-items: center; gap: 8px;
            position: absolute; right: 0px;
          }
          .humidifier-current-label { font-size: 11px; opacity: 0.5; text-transform: uppercase; letter-spacing: 1px; }
          .humidifier-current-value { font-size: 28px; font-weight: 300; }

          .humidifier-slider-group { display: flex; flex-direction: column; align-items: center; gap: 12px; height: 320px; width: 80px; }
          .value-display { font-size: ${valueSize}px; font-weight: ${valueWeight}; text-align: center; }
          .value-display span { font-size: ${Math.max(14, Math.round(valueSize/2))}px; opacity: 0.7; }
          .slider-label { font-size: 12px; opacity: 0.5; text-transform: uppercase; letter-spacing: 1px; }

          .vertical-slider-track {
            width: 100%; flex: 1; 
            background: var(--secondary-background-color, rgba(255, 255, 255, 0.1));
            border: 2px solid var(--divider-color, rgba(255, 255, 255, 0.1));
            border-radius: ${borderRadius}px; position: relative; overflow: hidden; cursor: pointer;
          }
          .vertical-slider-fill {
            position: absolute; bottom: 0; left: 0; right: 0;
            background: ${color}; transition: background 0.3s;
            border-radius: 0 0 ${borderRadius}px ${borderRadius}px;
          }
          .vertical-slider-thumb {
            position: absolute; left: 50%; transform: translateX(-50%);
            width: 90px; height: 6px; background: white;
            border-radius: 4px; box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            pointer-events: none;
          }

          .hki-popup-nav {
            display: flex; justify-content: space-evenly; padding: 12px;
            background: rgba(255, 255, 255, 0.03);
            border-top: 1px solid var(--divider-color, rgba(255, 255, 255, 0.05));
            gap: 8px;
            flex-shrink: 0;
          }
          .nav-btn {
            flex: 1; height: 50px; border-radius: 12px;
            border: none; background: transparent;
            color: var(--primary-text-color); opacity: 0.5;
            cursor: pointer;
            display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px;
            transition: all 0.2s; font-size: 11px;
          }
          .nav-btn:hover { opacity: 0.8; background: rgba(255, 255, 255, 0.05); }
          .nav-btn.active { 
            opacity: 1; 
            background: var(--primary-color, rgba(255,255,255,0.1)); 
            color: var(--text-primary-color, var(--primary-text-color));
          }
          .nav-btn ha-icon { --mdc-icon-size: 24px; }

          .mode-list { width: 100%; display: flex; flex-direction: column; gap: 8px; }
          .mode-item { 
            padding: 14px; 
            background: rgba(255,255,255,0.05); 
            border-radius: 8px; 
            cursor: pointer; 
            display: flex; 
            justify-content: space-between; 
            align-items: center;
            transition: all 0.2s;
          }
          .mode-item:hover { background: rgba(255,255,255,0.08); }
          .mode-item.active { background: ${color}; color: white; }

          .timeline-container { width: 100%; height: 100%; overflow-y: auto; padding: 12px; box-sizing: border-box; }
          .timeline-item { display: flex; gap: 12px; position: relative; }
          .timeline-visual { display: flex; flex-direction: column; align-items: center; width: 20px; flex-shrink: 0; }
          .timeline-dot { width: 10px; height: 10px; border-radius: 50%; background: var(--primary-color, #FFD700); z-index: 2; border: 2px solid var(--card-background-color, #1c1c1c); }
          .timeline-line { width: 2px; flex-grow: 1; background: var(--divider-color, rgba(255,255,255,0.1)); margin-top: -2px; margin-bottom: -4px; }
          .timeline-item:last-child .timeline-line { display: none; }
          .timeline-content { flex: 1; padding-bottom: 16px; font-size: 13px; color: var(--primary-text-color); }
          .timeline-detail { font-size: 11px; opacity: 0.6; display: block; margin-top: 4px; }
          .timeline-ago { font-size: 10px; opacity: 0.5; display: block; margin-top: 2px; }
          .timeline-trigger { font-size: 10px; opacity: 0.5; display: block; margin-top: 2px; font-style: italic; }
          .history-loading { width: 100%; text-align: center; padding: 20px; opacity: 0.6; }
        </style>

        <div class="hki-popup-container">
          <div class="hki-popup-header">
            <div class="hki-popup-title">
              <ha-icon icon="${icon}" style="color: ${color}"></ha-icon>
              <div class="hki-popup-title-text">
                ${name}
                <span class="hki-popup-state">${isOn ? 'On' : 'Off'}${this._formatLastTriggered(entity) ? ` - ${this._formatLastTriggered(entity)}` : ''}</span>
              </div>
            </div>
            <div class="hki-popup-header-controls">
              <button class="header-btn" id="humidifierHistoryBtn"><ha-icon icon="mdi:chart-box-outline"></ha-icon></button>
              <button class="header-btn" id="closeBtn"><ha-icon icon="mdi:close"></ha-icon></button>
            </div>
          </div>

          <div class="hki-tabs">
            <button class="tab-btn ${this._activeView === 'main' ? 'active' : ''}" id="tabMain" style="${this._activeView === 'main' ? this._getPopupButtonStyle(true) : this._getPopupButtonStyle(false)}"><ha-icon icon="mdi:water-percent"></ha-icon><span>Humidity</span></button>
            ${modes.length > 0 ? `<button class="tab-btn ${this._activeView === 'modes' ? 'active' : ''}" id="tabModes" style="${this._activeView === 'modes' ? this._getPopupButtonStyle(true) : this._getPopupButtonStyle(false)}"><ha-icon icon="mdi:tune"></ha-icon><span>Mode</span></button>` : ''}
          </div>

          <div class="hki-popup-content" id="humidifierContent">
            ${this._renderHumidifierPopupContent(entity, color, minHumidity, maxHumidity, targetHumidity, currentHumidity, valueSize, valueWeight, borderRadius)}
          </div>

          <div class="hki-popup-nav">
            <button class="nav-btn ${isOn ? 'active' : ''}" id="humidifierToggle" style="${isOn ? this._getPopupButtonStyle(true) : this._getPopupButtonStyle(false)}">
              <ha-icon icon="${isOn ? 'mdi:power' : 'mdi:power-off'}"></ha-icon>
              <span>${isOn ? 'On' : 'Off'}</span>
            </button>
          </div>
        </div>
      `;

      const container = portal.querySelector('.hki-popup-container');
      if (container) container.addEventListener('click', (e) => e.stopPropagation());

      let isBackgroundClick = false;
      portal.addEventListener('mousedown', (e) => { isBackgroundClick = (e.target === portal); });
      portal.addEventListener('touchstart', (e) => { isBackgroundClick = (e.target === portal); }, { passive: true });
      portal.addEventListener('click', (e) => {
        if (isBackgroundClick && e.target === portal) this._closePopup();
        isBackgroundClick = false;
      });

      document.body.appendChild(portal);
      this._popupPortal = portal;

      const closeBtn = portal.querySelector('#closeBtn');
      if (closeBtn) closeBtn.addEventListener('click', () => this._closePopup());

      const historyBtn = portal.querySelector('#humidifierHistoryBtn');
      if (historyBtn) {
        historyBtn.addEventListener('click', () => {
          this._activeView = this._activeView === 'history' ? 'main' : 'history';
          const content = portal.querySelector('#humidifierContent');
          if (content) {
            content.innerHTML = this._renderHumidifierPopupContent(entity, color, minHumidity, maxHumidity, targetHumidity, currentHumidity, valueSize, valueWeight, borderRadius);
            if (this._activeView === 'history') {
              setTimeout(() => this._loadHistory(), 100);
            } else {
              this._setupHumidifierContentHandlers(portal, entity, minHumidity, maxHumidity);
            }
          }
        });
      }

      const toggleBtn = portal.querySelector('#humidifierToggle');
      if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
          this.hass.callService('humidifier', isOn ? 'turn_off' : 'turn_on', { entity_id: this._config.entity });
        });
      }

      const tabMain = portal.querySelector('#tabMain');
      if (tabMain) {
        tabMain.addEventListener('click', () => {
          if (this._activeView === 'main') return;
          this._activeView = 'main';
          const content = portal.querySelector('#humidifierContent');
          if (content) {
            content.innerHTML = this._renderHumidifierPopupContent(entity, color, minHumidity, maxHumidity, targetHumidity, currentHumidity, valueSize, valueWeight, borderRadius);
            this._setupHumidifierContentHandlers(portal, entity, minHumidity, maxHumidity);
          }
          tabMain.classList.add('active');
          tabMain.style = this._getPopupButtonStyle(true);
          const tabModes = portal.querySelector('#tabModes');
          if (tabModes) {
            tabModes.classList.remove('active');
            tabModes.style = this._getPopupButtonStyle(false);
          }
        });
      }

      const tabModes = portal.querySelector('#tabModes');
      if (tabModes) {
        tabModes.addEventListener('click', () => {
          if (this._activeView === 'modes') return;
          this._activeView = 'modes';
          const content = portal.querySelector('#humidifierContent');
          if (content) {
            content.innerHTML = this._renderHumidifierModesList(modes, currentMode, color);
            this._setupHumidifierContentHandlers(portal, entity, minHumidity, maxHumidity);
          }
          tabModes.classList.add('active');
          tabModes.style = this._getPopupButtonStyle(true);
          if (tabMain) {
            tabMain.classList.remove('active');
            tabMain.style = this._getPopupButtonStyle(false);
          }
        });
      }

      this._setupHumidifierContentHandlers(portal, entity, minHumidity, maxHumidity);
    }

    _renderHumidifierPopupContent(entity, color, minHumidity, maxHumidity, targetHumidity, currentHumidity, valueSize, valueWeight, borderRadius) {
      if (this._activeView === 'history') {
        return `<div class="timeline-container" data-view-type="history" id="historyContainer"><div class="history-loading">Loading Timeline...</div></div>`;
      }

      if (this._activeView === 'modes') {
        const modes = entity.attributes.available_modes || [];
        const currentMode = entity.attributes.mode || 'normal';
        return this._renderHumidifierModesList(modes, currentMode, color);
      }

      if (entity.state === 'off') {
        return `<div style="opacity: 0.5; font-size: 18px; font-weight: 500;">Humidifier is Off</div>`;
      }

      const range = maxHumidity - minHumidity;
      const pct = ((targetHumidity - minHumidity) / range) * 100;

      return `
        <div class="slider-with-buttons">
          <div class="humidifier-slider-group">
            <div class="value-display" id="displayHumidity">${targetHumidity}<span>%</span></div>
            <div class="vertical-slider-track" id="sliderHumidity">
              <div class="vertical-slider-fill" style="height: ${pct}%; background: ${color};"></div>
              <div class="vertical-slider-thumb" style="bottom: calc(${pct}% - 6px)"></div>
            </div>
            <div class="slider-label">Target</div>
          </div>
          <div class="humidifier-current-display">
            <div class="humidifier-current-label">Current</div>
            <div class="humidifier-current-value">${currentHumidity}<span style="font-size: 18px; opacity: 0.7;">%</span></div>
          </div>
        </div>
      `;
    }

    _renderHumidifierModesList(modes, currentMode, color) {
      return `
        <div class="mode-list">
          ${modes.map(mode => `
            <div class="mode-item ${mode === currentMode ? 'active' : ''}" data-mode="${mode}">
              <span style="text-transform: capitalize;">${mode.replace(/_/g, ' ')}</span>
              ${mode === currentMode ? '<ha-icon icon="mdi:check"></ha-icon>' : ''}
            </div>
          `).join('')}
        </div>
      `;
    }

    _setupHumidifierContentHandlers(portal, entity, minHumidity, maxHumidity) {
      if (this._activeView === 'modes') {
        const modeItems = portal.querySelectorAll('.mode-item');
        modeItems.forEach(item => {
          item.addEventListener('click', () => {
            const mode = item.getAttribute('data-mode');
            this.hass.callService('humidifier', 'set_mode', {
              entity_id: this._config.entity,
              mode: mode
            });
          });
        });
        return;
      }

      if (this._activeView === 'history') {
        return;
      }

      const slider = portal.querySelector('#sliderHumidity');
      if (!slider) return;

      const range = maxHumidity - minHumidity;
      const updateHumidity = (clientY) => {
        const rect = slider.getBoundingClientRect();
        const pct = Math.max(0, Math.min(1, (rect.bottom - clientY) / rect.height));
        const value = Math.round(minHumidity + pct * range);
        
        const display = portal.querySelector('#displayHumidity');
        const fill = slider.querySelector('.vertical-slider-fill');
        const thumb = slider.querySelector('.vertical-slider-thumb');
        
        if (display) display.innerHTML = `${value}<span>%</span>`;
        if (fill) fill.style.height = `${pct * 100}%`;
        if (thumb) thumb.style.bottom = `calc(${pct * 100}% - 6px)`;
        
        return value;
      };

      let isDragging = false;
      const handleMove = (clientY) => {
        if (!isDragging) return;
        updateHumidity(clientY);
      };

      const handleEnd = (clientY) => {
        if (!isDragging) return;
        isDragging = false;
        const value = updateHumidity(clientY);
        this.hass.callService('humidifier', 'set_humidity', {
          entity_id: this._config.entity,
          humidity: value
        });
      };

      slider.addEventListener('mousedown', (e) => {
        isDragging = true;
        updateHumidity(e.clientY);
      });
      document.addEventListener('mousemove', (e) => handleMove(e.clientY));
      document.addEventListener('mouseup', (e) => handleEnd(e.clientY));

      slider.addEventListener('touchstart', (e) => {
        isDragging = true;
        updateHumidity(e.touches[0].clientY);
      }, { passive: true });
      document.addEventListener('touchmove', (e) => {
        if (isDragging) handleMove(e.touches[0].clientY);
      }, { passive: true });
      document.addEventListener('touchend', (e) => {
        if (isDragging && e.changedTouches.length > 0) {
          handleEnd(e.changedTouches[0].clientY);
        }
      }, { passive: true });
    }


    /**
     * Fan Popup
     */
    _renderFanPopupPortal(entity) {
      if (this._popupPortal) this._popupPortal.remove();
      if (!entity) return;

      const name = this._config.name || entity.attributes.friendly_name || this._config.entity;
      const attrs = entity.attributes || {};
      const state = entity.state;
      const isOn = state === 'on';
      const speed = attrs.percentage || 0;
      const presetModes = attrs.preset_modes || [];
      const currentPreset = attrs.preset_mode || null;
      const direction = attrs.direction || 'forward';
      const oscillating = attrs.oscillating || false;
      const supportsDirection = attrs.supported_features ? (attrs.supported_features & 2) !== 0 : false;
      const supportsOscillate = attrs.supported_features ? (attrs.supported_features & 4) !== 0 : false;
      
      const color = isOn ? 'var(--primary-color, #03a9f4)' : 'var(--disabled-text-color, #6f6f6f)';
      const icon = isOn ? 'mdi:fan' : 'mdi:fan-off';
      const borderRadius = this._config.popup_slider_radius ?? 12;

      const valueSize = this._config.popup_value_font_size || 36;
      const valueWeight = this._config.popup_value_font_weight || 300;

      const portal = document.createElement('div');
      portal.className = 'hki-popup-portal';

      portal.innerHTML = `
        <style>
          .hki-popup-portal {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.7);
            display: flex; align-items: center; justify-content: center; z-index: 9999;
          }
          .hki-popup-container {
            background: var(--card-background-color, #1c1c1c);
            border-radius: 16px;
            width: 90%; max-width: 400px; height: 600px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
            display: flex; flex-direction: column; overflow: hidden;
          }
          .hki-popup-header {
            display: flex; justify-content: space-between; align-items: center; padding: 16px 20px;
            background: rgba(255, 255, 255, 0.03); border-bottom: 1px solid var(--divider-color, rgba(255, 255, 255, 0.05));
            flex-shrink: 0;
          }
          .hki-popup-title { display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0; }
          .hki-popup-title ha-icon { --mdc-icon-size: 24px; }
          .hki-popup-title-text { display: flex; flex-direction: column; gap: 2px; font-size: 16px; font-weight: 500; min-width: 0; }
          .hki-popup-state { font-size: 12px; opacity: 0.6; text-transform: capitalize; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
          .hki-popup-header-controls { display: flex; gap: 8px; align-items: center; }
          .header-btn {
            width: 40px; height: 40px; border-radius: 50%;
            background: var(--divider-color, rgba(255, 255, 255, 0.05)); border: none;
            color: var(--primary-text-color); cursor: pointer;
            display: flex; align-items: center; justify-content: center;
            transition: all 0.2s;
          }
          .header-btn:hover { background: rgba(255, 255, 255, 0.1); transform: scale(1.05); }
          .header-btn ha-icon { --mdc-icon-size: 20px; }

          .hki-tabs {
            display: flex; gap: 8px; padding: 8px 20px;
            background: rgba(255, 255, 255, 0.02);
            border-bottom: 1px solid var(--divider-color, rgba(255, 255, 255, 0.05));
            flex-shrink: 0;
          }
          .tab-btn {
            flex: 1; height: 40px; border-radius: 8px;
            background: transparent; border: 1px solid var(--divider-color, rgba(255,255,255,0.1));
            color: var(--primary-text-color); cursor: pointer;
            display: flex; align-items: center; justify-content: center; gap: 8px;
            transition: all 0.2s; font-size: 14px; font-weight: 500;
          }
          .tab-btn:hover { background: var(--secondary-background-color, rgba(255,255,255,0.08)); }
          .tab-btn.active { 
            background: var(--primary-color, rgba(255,255,255,0.12)); 
            border-color: transparent; 
            color: var(--text-primary-color, var(--primary-text-color));
          }

          .hki-popup-content { flex: 1; padding: 20px; overflow-y: auto; display: flex; align-items: center; justify-content: center; min-height: 0; }
          
          .fan-slider-wrapper {
            display: flex; align-items: center; justify-content: center; width: 100%;
          }
          .fan-slider-group { display: flex; flex-direction: column; align-items: center; gap: 12px; height: 320px; width: 80px; }
          .value-display { font-size: ${valueSize}px; font-weight: ${valueWeight}; text-align: center; }
          .value-display span { font-size: ${Math.max(14, Math.round(valueSize/2))}px; opacity: 0.7; }
          .slider-label { font-size: 12px; opacity: 0.5; text-transform: uppercase; letter-spacing: 1px; }

          .vertical-slider-track {
            width: 100%; flex: 1; 
            background: var(--secondary-background-color, rgba(255, 255, 255, 0.1));
            border: 2px solid var(--divider-color, rgba(255, 255, 255, 0.1));
            border-radius: ${borderRadius}px; position: relative; overflow: hidden; cursor: pointer;
          }
          .vertical-slider-fill {
            position: absolute; bottom: 0; left: 0; right: 0;
            background: ${color}; transition: background 0.3s;
            border-radius: 0 0 ${borderRadius}px ${borderRadius}px;
          }
          .vertical-slider-thumb {
            position: absolute; left: 50%; transform: translateX(-50%);
            width: 90px; height: 6px; background: white;
            border-radius: 4px; box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            pointer-events: none;
          }

          .hki-popup-nav {
            display: flex; justify-content: space-evenly; padding: 12px;
            background: rgba(255, 255, 255, 0.03);
            border-top: 1px solid var(--divider-color, rgba(255, 255, 255, 0.05));
            gap: 8px;
            flex-shrink: 0;
          }
          .nav-btn {
            flex: 1; height: 50px; border-radius: 12px;
            border: none; background: transparent;
            color: var(--primary-text-color); opacity: 0.5;
            cursor: pointer;
            display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px;
            transition: all 0.2s; font-size: 11px;
          }
          .nav-btn:hover { opacity: 0.8; background: rgba(255, 255, 255, 0.05); }
          .nav-btn.active { 
            opacity: 1; 
            background: var(--primary-color, rgba(255,255,255,0.1)); 
            color: var(--text-primary-color, var(--primary-text-color));
          }
          .nav-btn ha-icon { --mdc-icon-size: 24px; }

          .preset-list { width: 100%; display: flex; flex-direction: column; gap: 8px; }
          .preset-item { 
            padding: 14px; 
            background: rgba(255,255,255,0.05); 
            border-radius: 8px; 
            cursor: pointer; 
            display: flex; 
            justify-content: space-between; 
            align-items: center;
            transition: all 0.2s;
          }
          .preset-item:hover { background: rgba(255,255,255,0.08); }
          .preset-item.active { background: ${color}; color: white; }

          .timeline-container { width: 100%; height: 100%; overflow-y: auto; padding: 12px; box-sizing: border-box; }
          .timeline-item { display: flex; gap: 12px; position: relative; }
          .timeline-visual { display: flex; flex-direction: column; align-items: center; width: 20px; flex-shrink: 0; }
          .timeline-dot { width: 10px; height: 10px; border-radius: 50%; background: var(--primary-color, #FFD700); z-index: 2; border: 2px solid var(--card-background-color, #1c1c1c); }
          .timeline-line { width: 2px; flex-grow: 1; background: var(--divider-color, rgba(255,255,255,0.1)); margin-top: -2px; margin-bottom: -4px; }
          .timeline-item:last-child .timeline-line { display: none; }
          .timeline-content { flex: 1; padding-bottom: 16px; font-size: 13px; color: var(--primary-text-color); }
          .timeline-detail { font-size: 11px; opacity: 0.6; display: block; margin-top: 4px; }
          .timeline-ago { font-size: 10px; opacity: 0.5; display: block; margin-top: 2px; }
          .timeline-trigger { font-size: 10px; opacity: 0.5; display: block; margin-top: 2px; font-style: italic; }
          .history-loading { width: 100%; text-align: center; padding: 20px; opacity: 0.6; }
        </style>

        <div class="hki-popup-container">
          <div class="hki-popup-header">
            <div class="hki-popup-title">
              <ha-icon icon="${icon}" style="color: ${color}"></ha-icon>
              <div class="hki-popup-title-text">
                ${name}
                <span class="hki-popup-state">${isOn ? speed + '%' : 'Off'}${this._formatLastTriggered(entity) ? ` - ${this._formatLastTriggered(entity)}` : ''}</span>
              </div>
            </div>
            <div class="hki-popup-header-controls">
              <button class="header-btn" id="fanHistoryBtn"><ha-icon icon="mdi:chart-box-outline"></ha-icon></button>
              <button class="header-btn" id="closeBtn"><ha-icon icon="mdi:close"></ha-icon></button>
            </div>
          </div>

          <div class="hki-tabs">
            <button class="tab-btn ${this._activeView === 'main' ? 'active' : ''}" id="tabMain" style="${this._activeView === 'main' ? this._getPopupButtonStyle(true) : this._getPopupButtonStyle(false)}"><ha-icon icon="mdi:fan"></ha-icon><span>Speed</span></button>
            ${presetModes.length > 0 ? `<button class="tab-btn ${this._activeView === 'presets' ? 'active' : ''}" id="tabPresets" style="${this._activeView === 'presets' ? this._getPopupButtonStyle(true) : this._getPopupButtonStyle(false)}"><ha-icon icon="mdi:tune"></ha-icon><span>Presets</span></button>` : ''}
          </div>

          <div class="hki-popup-content" id="fanContent">
            ${this._renderFanPopupContent(entity, color, speed, valueSize, valueWeight, borderRadius)}
          </div>

          <div class="hki-popup-nav">
            <button class="nav-btn ${isOn ? 'active' : ''}" id="fanToggle" style="${isOn ? this._getPopupButtonStyle(true) : this._getPopupButtonStyle(false)}">
              <ha-icon icon="${isOn ? 'mdi:power' : 'mdi:power-off'}"></ha-icon>
              <span>${isOn ? 'On' : 'Off'}</span>
            </button>
            ${supportsDirection ? `
              <button class="nav-btn ${direction === 'reverse' ? 'active' : ''}" id="fanDirection" style="${direction === 'reverse' ? this._getPopupButtonStyle(true) : this._getPopupButtonStyle(false)}">
                <ha-icon icon="${direction === 'reverse' ? 'mdi:rotate-left' : 'mdi:rotate-right'}"></ha-icon>
                <span>${direction === 'reverse' ? 'Reverse' : 'Forward'}</span>
              </button>
            ` : ''}
            ${supportsOscillate ? `
              <button class="nav-btn ${oscillating ? 'active' : ''}" id="fanOscillate" style="${oscillating ? this._getPopupButtonStyle(true) : this._getPopupButtonStyle(false)}">
                <ha-icon icon="${oscillating ? 'mdi:arrow-oscillating' : 'mdi:arrow-oscillating-off'}"></ha-icon>
                <span>Oscillate</span>
              </button>
            ` : ''}
          </div>
        </div>
      `;

      const container = portal.querySelector('.hki-popup-container');
      if (container) container.addEventListener('click', (e) => e.stopPropagation());

      let isBackgroundClick = false;
      portal.addEventListener('mousedown', (e) => { isBackgroundClick = (e.target === portal); });
      portal.addEventListener('touchstart', (e) => { isBackgroundClick = (e.target === portal); }, { passive: true });
      portal.addEventListener('click', (e) => {
        if (isBackgroundClick && e.target === portal) this._closePopup();
        isBackgroundClick = false;
      });

      document.body.appendChild(portal);
      this._popupPortal = portal;

      const closeBtn = portal.querySelector('#closeBtn');
      if (closeBtn) closeBtn.addEventListener('click', () => this._closePopup());

      const historyBtn = portal.querySelector('#fanHistoryBtn');
      if (historyBtn) {
        historyBtn.addEventListener('click', () => {
          this._activeView = this._activeView === 'history' ? 'main' : 'history';
          const content = portal.querySelector('#fanContent');
          if (content) {
            content.innerHTML = this._renderFanPopupContent(entity, color, speed, valueSize, valueWeight, borderRadius);
            if (this._activeView === 'history') {
              setTimeout(() => this._loadHistory(), 100);
            } else {
              this._setupFanContentHandlers(portal, entity);
            }
          }
        });
      }

      const toggleBtn = portal.querySelector('#fanToggle');
      if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
          this.hass.callService('fan', isOn ? 'turn_off' : 'turn_on', { entity_id: this._config.entity });
        });
      }

      const directionBtn = portal.querySelector('#fanDirection');
      if (directionBtn) {
        directionBtn.addEventListener('click', () => {
          this.hass.callService('fan', 'set_direction', {
            entity_id: this._config.entity,
            direction: direction === 'forward' ? 'reverse' : 'forward'
          });
        });
      }

      const oscillateBtn = portal.querySelector('#fanOscillate');
      if (oscillateBtn) {
        oscillateBtn.addEventListener('click', () => {
          this.hass.callService('fan', 'oscillate', {
            entity_id: this._config.entity,
            oscillating: !oscillating
          });
        });
      }

      const tabMain = portal.querySelector('#tabMain');
      if (tabMain) {
        tabMain.addEventListener('click', () => {
          if (this._activeView === 'main') return;
          this._activeView = 'main';
          const content = portal.querySelector('#fanContent');
          if (content) {
            content.innerHTML = this._renderFanPopupContent(entity, color, speed, valueSize, valueWeight, borderRadius);
            this._setupFanContentHandlers(portal, entity);
          }
          tabMain.classList.add('active');
          tabMain.style = this._getPopupButtonStyle(true);
          const tabPresets = portal.querySelector('#tabPresets');
          if (tabPresets) {
            tabPresets.classList.remove('active');
            tabPresets.style = this._getPopupButtonStyle(false);
          }
        });
      }

      const tabPresets = portal.querySelector('#tabPresets');
      if (tabPresets) {
        tabPresets.addEventListener('click', () => {
          if (this._activeView === 'presets') return;
          this._activeView = 'presets';
          const content = portal.querySelector('#fanContent');
          if (content) {
            content.innerHTML = this._renderFanPresetsList(presetModes, currentPreset, color);
            this._setupFanContentHandlers(portal, entity);
          }
          tabPresets.classList.add('active');
          tabPresets.style = this._getPopupButtonStyle(true);
          if (tabMain) {
            tabMain.classList.remove('active');
            tabMain.style = this._getPopupButtonStyle(false);
          }
        });
      }

      this._setupFanContentHandlers(portal, entity);
    }

    _renderFanPopupContent(entity, color, speed, valueSize, valueWeight, borderRadius) {
      if (this._activeView === 'history') {
        return `<div class="timeline-container" data-view-type="history" id="historyContainer"><div class="history-loading">Loading Timeline...</div></div>`;
      }

      if (this._activeView === 'presets') {
        const presetModes = entity.attributes.preset_modes || [];
        const currentPreset = entity.attributes.preset_mode || null;
        return this._renderFanPresetsList(presetModes, currentPreset, color);
      }

      if (entity.state === 'off') {
        return `<div style="opacity: 0.5; font-size: 18px; font-weight: 500;">Fan is Off</div>`;
      }

      const pct = speed;

      return `
        <div class="fan-slider-wrapper">
          <div class="fan-slider-group">
            <div class="value-display" id="displaySpeed">${speed}<span>%</span></div>
            <div class="vertical-slider-track" id="sliderSpeed">
              <div class="vertical-slider-fill" style="height: ${pct}%; background: ${color};"></div>
              <div class="vertical-slider-thumb" style="bottom: calc(${pct}% - 6px)"></div>
            </div>
            <div class="slider-label">Speed</div>
          </div>
        </div>
      `;
    }

    _renderFanPresetsList(presetModes, currentPreset, color) {
      return `
        <div class="preset-list">
          ${presetModes.map(preset => `
            <div class="preset-item ${preset === currentPreset ? 'active' : ''}" data-preset="${preset}">
              <span style="text-transform: capitalize;">${preset.replace(/_/g, ' ')}</span>
              ${preset === currentPreset ? '<ha-icon icon="mdi:check"></ha-icon>' : ''}
            </div>
          `).join('')}
        </div>
      `;
    }

    _setupFanContentHandlers(portal, entity) {
      if (this._activeView === 'presets') {
        const presetItems = portal.querySelectorAll('.preset-item');
        presetItems.forEach(item => {
          item.addEventListener('click', () => {
            const preset = item.getAttribute('data-preset');
            this.hass.callService('fan', 'set_preset_mode', {
              entity_id: this._config.entity,
              preset_mode: preset
            });
          });
        });
        return;
      }

      if (this._activeView === 'history') {
        return;
      }

      const slider = portal.querySelector('#sliderSpeed');
      if (!slider) return;

      const updateSpeed = (clientY) => {
        const rect = slider.getBoundingClientRect();
        const pct = Math.max(0, Math.min(100, Math.round(((rect.bottom - clientY) / rect.height) * 100)));
        
        const display = portal.querySelector('#displaySpeed');
        const fill = slider.querySelector('.vertical-slider-fill');
        const thumb = slider.querySelector('.vertical-slider-thumb');
        
        if (display) display.innerHTML = `${pct}<span>%</span>`;
        if (fill) fill.style.height = `${pct}%`;
        if (thumb) thumb.style.bottom = `calc(${pct}% - 6px)`;
        
        return pct;
      };

      let isDragging = false;
      const handleMove = (clientY) => {
        if (!isDragging) return;
        updateSpeed(clientY);
      };

      const handleEnd = (clientY) => {
        if (!isDragging) return;
        isDragging = false;
        const value = updateSpeed(clientY);
        this.hass.callService('fan', 'set_percentage', {
          entity_id: this._config.entity,
          percentage: value
        });
      };

      slider.addEventListener('mousedown', (e) => {
        isDragging = true;
        updateSpeed(e.clientY);
      });
      document.addEventListener('mousemove', (e) => handleMove(e.clientY));
      document.addEventListener('mouseup', (e) => handleEnd(e.clientY));

      slider.addEventListener('touchstart', (e) => {
        isDragging = true;
        updateSpeed(e.touches[0].clientY);
      }, { passive: true });
      document.addEventListener('touchmove', (e) => {
        if (isDragging) handleMove(e.touches[0].clientY);
      }, { passive: true });
      document.addEventListener('touchend', (e) => {
        if (isDragging && e.changedTouches.length > 0) {
          handleEnd(e.changedTouches[0].clientY);
        }
      }, { passive: true });
    }


    /**
     * Switch Popup
     */
    /**
     * Switch Popup - HomeKit Style Vertical Toggle
     */
    /**
     * Switch Popup - HomeKit Style Vertical Toggle
     */
    _renderSwitchPopupPortal(entity) {
      if (this._popupPortal) this._popupPortal.remove();
      if (!entity) return;

      const name = this._config.name || entity.attributes.friendly_name || this._config.entity;
      const state = entity.state;
      const isOn = state === 'on';
      
      const color = isOn ? 'var(--primary-color, #03a9f4)' : 'var(--disabled-text-color, #6f6f6f)';
      const icon = isOn ? 'mdi:toggle-switch' : 'mdi:toggle-switch-off';
      const borderRadius = this._config.popup_slider_radius ?? 12;
      const valueSize = this._config.popup_value_font_size || 32;
      const valueWeight = this._config.popup_value_font_weight || 300;

      const portal = document.createElement('div');
      portal.className = 'hki-popup-portal';

      portal.innerHTML = `
        <style>
          .hki-popup-portal {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.7);
            display: flex; align-items: center; justify-content: center; z-index: 9999;
          }
          .hki-popup-container {
            background: var(--card-background-color, #1c1c1c);
            border-radius: 16px;
            width: 90%; max-width: 400px; height: 600px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
            display: flex; flex-direction: column; overflow: hidden;
          }
          .hki-popup-header {
            display: flex; justify-content: space-between; align-items: center; padding: 16px 20px;
            background: rgba(255, 255, 255, 0.03); border-bottom: 1px solid var(--divider-color, rgba(255, 255, 255, 0.05));
            flex-shrink: 0;
          }
          .hki-popup-title { display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0; }
          .hki-popup-title ha-icon { --mdc-icon-size: 24px; }
          .hki-popup-title-text { display: flex; flex-direction: column; gap: 2px; font-size: 16px; font-weight: 500; min-width: 0; }
          .hki-popup-state { font-size: 12px; opacity: 0.6; text-transform: capitalize; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
          .hki-popup-header-controls { display: flex; gap: 8px; align-items: center; }
          .header-btn {
            width: 40px; height: 40px; border-radius: 50%;
            background: var(--divider-color, rgba(255, 255, 255, 0.05)); border: none;
            color: var(--primary-text-color); cursor: pointer;
            display: flex; align-items: center; justify-content: center;
            transition: all 0.2s;
          }
          .header-btn:hover { background: rgba(255, 255, 255, 0.1); transform: scale(1.05); }
          .header-btn ha-icon { --mdc-icon-size: 20px; }

          .hki-popup-content { 
            flex: 1; padding: 20px; overflow-y: auto; 
            display: flex; align-items: center; justify-content: center; 
            min-height: 0; 
          }

          .switch-container {
            display: flex; flex-direction: column; align-items: center; gap: 24px;
          }
          
          .homekit-switch {
            width: 100px;
            height: 200px;
            background: ${isOn ? color : 'var(--secondary-background-color, rgba(255,255,255,0.1))'};
            border-radius: ${borderRadius * 4}px;
            position: relative;
            cursor: pointer;
            transition: background 0.3s ease;
            border: 2px solid var(--divider-color, rgba(255,255,255,0.1));
          }
          
          .homekit-switch-thumb {
            position: absolute;
            width: 88px;
            height: 88px;
            background: white;
            border-radius: 50%;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            transition: top 0.3s ease;
            left: 4px;
            top: ${isOn ? '4px' : 'calc(100% - 92px)'};
          }
          
          .switch-state-text {
            font-size: ${valueSize}px;
            font-weight: ${valueWeight};
            text-transform: uppercase;
            letter-spacing: 2px;
            opacity: 0.8;
          }

          .timeline-container { width: 100%; height: 100%; overflow-y: auto; padding: 12px; box-sizing: border-box; }
          .timeline-item { display: flex; gap: 12px; position: relative; }
          .timeline-visual { display: flex; flex-direction: column; align-items: center; width: 20px; flex-shrink: 0; }
          .timeline-dot { width: 10px; height: 10px; border-radius: 50%; background: var(--primary-color, #FFD700); z-index: 2; border: 2px solid var(--card-background-color, #1c1c1c); }
          .timeline-line { width: 2px; flex-grow: 1; background: var(--divider-color, rgba(255,255,255,0.1)); margin-top: -2px; margin-bottom: -4px; }
          .timeline-item:last-child .timeline-line { display: none; }
          .timeline-content { flex: 1; padding-bottom: 16px; font-size: 13px; color: var(--primary-text-color); }
          .timeline-detail { font-size: 11px; opacity: 0.6; display: block; margin-top: 4px; }
          .timeline-ago { font-size: 10px; opacity: 0.5; display: block; margin-top: 2px; }
          .timeline-trigger { font-size: 10px; opacity: 0.5; display: block; margin-top: 2px; font-style: italic; }
          .history-loading { width: 100%; text-align: center; padding: 20px; opacity: 0.6; }
        </style>

        <div class="hki-popup-container">
          <div class="hki-popup-header">
            <div class="hki-popup-title">
              <ha-icon icon="${icon}" style="color: ${color}"></ha-icon>
              <div class="hki-popup-title-text">
                ${name}
                <span class="hki-popup-state">${isOn ? 'On' : 'Off'}${this._formatLastTriggered(entity) ? ` - ${this._formatLastTriggered(entity)}` : ''}</span>
              </div>
            </div>
            <div class="hki-popup-header-controls">
              <button class="header-btn" id="switchHistoryBtn"><ha-icon icon="mdi:chart-box-outline"></ha-icon></button>
              <button class="header-btn" id="closeBtn"><ha-icon icon="mdi:close"></ha-icon></button>
            </div>
          </div>

          <div class="hki-popup-content" id="switchContent">
            ${this._renderSwitchPopupContent(entity, color, icon, isOn, borderRadius, valueSize, valueWeight)}
          </div>
        </div>
      `;

      const container = portal.querySelector('.hki-popup-container');
      if (container) container.addEventListener('click', (e) => e.stopPropagation());

      let isBackgroundClick = false;
      portal.addEventListener('mousedown', (e) => { isBackgroundClick = (e.target === portal); });
      portal.addEventListener('touchstart', (e) => { isBackgroundClick = (e.target === portal); }, { passive: true });
      portal.addEventListener('click', (e) => {
        if (isBackgroundClick && e.target === portal) this._closePopup();
        isBackgroundClick = false;
      });

      document.body.appendChild(portal);
      this._popupPortal = portal;

      const closeBtn = portal.querySelector('#closeBtn');
      if (closeBtn) closeBtn.addEventListener('click', () => this._closePopup());

      const historyBtn = portal.querySelector('#switchHistoryBtn');
      if (historyBtn) {
        historyBtn.addEventListener('click', () => {
          this._activeView = this._activeView === 'history' ? 'main' : 'history';
          const content = portal.querySelector('#switchContent');
          if (content) {
            content.innerHTML = this._renderSwitchPopupContent(entity, color, icon, isOn, borderRadius, valueSize, valueWeight);
            if (this._activeView === 'history') {
              setTimeout(() => this._loadHistory(), 100);
            } else {
              this._setupSwitchHandlers(portal, entity);
            }
          }
        });
      }

      this._setupSwitchHandlers(portal, entity);
    }

    _renderSwitchPopupContent(entity, color, icon, isOn, borderRadius, valueSize, valueWeight) {
      if (this._activeView === 'history') {
        return `<div class="timeline-container" data-view-type="history" id="historyContainer"><div class="history-loading">Loading Timeline...</div></div>`;
      }

      return `
        <div class="switch-container">
          <div class="homekit-switch" id="homekitSwitch">
            <div class="homekit-switch-thumb"></div>
          </div>
          <div class="switch-state-text">${isOn ? 'On' : 'Off'}</div>
        </div>
      `;
    }

    _setupSwitchHandlers(portal, entity) {
      if (this._activeView === 'history') return;

      const switchEl = portal.querySelector('#homekitSwitch');
      if (!switchEl) return;

      switchEl.addEventListener('click', () => {
        const isOn = entity.state === 'on';
        this.hass.callService('switch', isOn ? 'turn_off' : 'turn_on', { entity_id: this._config.entity });
      });
    }

    /**
     * Lock Popup - HA Style Vertical Slider
     */
    _renderLockPopupPortal(entity) {
      if (this._popupPortal) this._popupPortal.remove();
      if (!entity) return;

      const name = this._config.name || entity.attributes.friendly_name || this._config.entity;
      const state = entity.state;
      const isLocked = state === 'locked';
      const isUnlocked = state === 'unlocked';
      const isJammed = state === 'jammed';
      const isLocking = state === 'locking';
      const isUnlocking = state === 'unlocking';
      
      const color = isLocked ? '#4CAF50' : (isJammed ? '#F44336' : '#FFC107');
      const icon = isLocked ? 'mdi:lock' : (isJammed ? 'mdi:lock-alert' : 'mdi:lock-open');
      const stateText = isLocked ? 'Locked' : (isJammed ? 'Jammed' : (isLocking ? 'Locking' : (isUnlocking ? 'Unlocking' : 'Unlocked')));
      const borderRadius = this._config.popup_slider_radius ?? 12;
      const valueSize = this._config.popup_value_font_size || 32;
      const valueWeight = this._config.popup_value_font_weight || 300;

      // Check if lock supports open
      const supportsOpen = entity.attributes.supported_features ? (entity.attributes.supported_features & 2) !== 0 : false;

      const portal = document.createElement('div');
      portal.className = 'hki-popup-portal';

      // Calculate slider position (locked = top/100%, unlocked = bottom/0%)
      const sliderPosition = isLocked ? 100 : (isLocking || isUnlocking ? 50 : 0);

      portal.innerHTML = `
        <style>
          .hki-popup-portal {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.7);
            display: flex; align-items: center; justify-content: center; z-index: 9999;
          }
          .hki-popup-container {
            background: var(--card-background-color, #1c1c1c);
            border-radius: 16px;
            width: 90%; max-width: 400px; height: 600px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
            display: flex; flex-direction: column; overflow: hidden;
          }
          .hki-popup-header {
            display: flex; justify-content: space-between; align-items: center; padding: 16px 20px;
            background: rgba(255, 255, 255, 0.03); border-bottom: 1px solid var(--divider-color, rgba(255, 255, 255, 0.05));
            flex-shrink: 0;
          }
          .hki-popup-title { display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0; }
          .hki-popup-title ha-icon { --mdc-icon-size: 24px; }
          .hki-popup-title-text { display: flex; flex-direction: column; gap: 2px; font-size: 16px; font-weight: 500; min-width: 0; }
          .hki-popup-state { font-size: 12px; opacity: 0.6; text-transform: capitalize; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
          .hki-popup-header-controls { display: flex; gap: 8px; align-items: center; }
          .header-btn {
            width: 40px; height: 40px; border-radius: 50%;
            background: var(--divider-color, rgba(255, 255, 255, 0.05)); border: none;
            color: var(--primary-text-color); cursor: pointer;
            display: flex; align-items: center; justify-content: center;
            transition: all 0.2s;
          }
          .header-btn:hover { background: rgba(255, 255, 255, 0.1); transform: scale(1.05); }
          .header-btn ha-icon { --mdc-icon-size: 20px; }

          .hki-popup-content { 
            flex: 1; padding: 20px; overflow-y: auto; 
            display: flex; align-items: center; justify-content: center; 
            min-height: 0; 
          }

          .lock-slider-container {
            display: flex; flex-direction: column; align-items: center; gap: 20px;
          }
          
          .lock-state-display {
            font-size: ${valueSize}px;
            font-weight: ${valueWeight};
            text-transform: capitalize;
            letter-spacing: 1px;
            opacity: 0.9;
          }
          
          .lock-vertical-slider {
            width: 100px;
            height: 320px;
            background: var(--secondary-background-color, rgba(255,255,255,0.1));
            border: 2px solid var(--divider-color, rgba(255,255,255,0.1));
            border-radius: ${borderRadius}px;
            position: relative;
            overflow: visible;
            cursor: pointer;
          }
          
          .lock-slider-fill {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            background: ${color};
            transition: height 0.3s ease, background 0.3s ease;
            height: ${sliderPosition}%;
            border-radius: 0 0 ${Math.max(0, borderRadius - 2)}px ${Math.max(0, borderRadius - 2)}px;
          }
          
          .lock-slider-thumb {
            position: absolute;
            left: 50%;
            transform: translateX(-50%);
            width: 80px;
            height: 80px;
            background: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 16px rgba(0,0,0,0.4);
            pointer-events: none;
            transition: bottom 0.3s ease;
            bottom: calc(${sliderPosition}% - 40px);
          }
          
          .lock-slider-thumb ha-icon {
            --mdc-icon-size: 40px;
            color: ${color};
          }

          .hki-popup-nav {
            display: flex; justify-content: space-evenly; padding: 12px;
            background: rgba(255, 255, 255, 0.03);
            border-top: 1px solid var(--divider-color, rgba(255, 255, 255, 0.05));
            gap: 8px;
            flex-shrink: 0;
          }
          .nav-btn {
            flex: 1; height: 50px; border-radius: 12px;
            border: none; background: transparent;
            color: var(--primary-text-color); opacity: 0.5;
            cursor: pointer;
            display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px;
            transition: all 0.2s; font-size: 11px;
          }
          .nav-btn:hover { opacity: 0.8; background: rgba(255, 255, 255, 0.05); }
          .nav-btn.active { 
            opacity: 1; 
            background: var(--primary-color, rgba(255,255,255,0.1)); 
            color: var(--text-primary-color, var(--primary-text-color));
          }
          .nav-btn ha-icon { --mdc-icon-size: 24px; }

          .timeline-container { width: 100%; height: 100%; overflow-y: auto; padding: 12px; box-sizing: border-box; }
          .timeline-item { display: flex; gap: 12px; position: relative; }
          .timeline-visual { display: flex; flex-direction: column; align-items: center; width: 20px; flex-shrink: 0; }
          .timeline-dot { width: 10px; height: 10px; border-radius: 50%; background: var(--primary-color, #FFD700); z-index: 2; border: 2px solid var(--card-background-color, #1c1c1c); }
          .timeline-line { width: 2px; flex-grow: 1; background: var(--divider-color, rgba(255,255,255,0.1)); margin-top: -2px; margin-bottom: -4px; }
          .timeline-item:last-child .timeline-line { display: none; }
          .timeline-content { flex: 1; padding-bottom: 16px; font-size: 13px; color: var(--primary-text-color); }
          .timeline-detail { font-size: 11px; opacity: 0.6; display: block; margin-top: 4px; }
          .timeline-ago { font-size: 10px; opacity: 0.5; display: block; margin-top: 2px; }
          .timeline-trigger { font-size: 10px; opacity: 0.5; display: block; margin-top: 2px; font-style: italic; }
          .history-loading { width: 100%; text-align: center; padding: 20px; opacity: 0.6; }
        </style>

        <div class="hki-popup-container">
          <div class="hki-popup-header">
            <div class="hki-popup-title">
              <ha-icon icon="${icon}" style="color: ${color}"></ha-icon>
              <div class="hki-popup-title-text">
                ${name}
                <span class="hki-popup-state">${stateText}${this._formatLastTriggered(entity) ? ` - ${this._formatLastTriggered(entity)}` : ''}</span>
              </div>
            </div>
            <div class="hki-popup-header-controls">
              <button class="header-btn" id="lockHistoryBtn"><ha-icon icon="mdi:chart-box-outline"></ha-icon></button>
              <button class="header-btn" id="closeBtn"><ha-icon icon="mdi:close"></ha-icon></button>
            </div>
          </div>

          <div class="hki-popup-content" id="lockContent">
            ${this._renderLockPopupContent(entity, color, icon, stateText, sliderPosition, borderRadius, valueSize, valueWeight)}
          </div>

          <div class="hki-popup-nav">
            ${supportsOpen ? `
              <button class="nav-btn" id="openDoorBtn" style="${this._getPopupButtonStyle(false)}">
                <ha-icon icon="mdi:door-open"></ha-icon>
                <span>Open Door</span>
              </button>
            ` : ''}
          </div>
        </div>
      `;

      const container = portal.querySelector('.hki-popup-container');
      if (container) container.addEventListener('click', (e) => e.stopPropagation());

      let isBackgroundClick = false;
      portal.addEventListener('mousedown', (e) => { isBackgroundClick = (e.target === portal); });
      portal.addEventListener('touchstart', (e) => { isBackgroundClick = (e.target === portal); }, { passive: true });
      portal.addEventListener('click', (e) => {
        if (isBackgroundClick && e.target === portal) this._closePopup();
        isBackgroundClick = false;
      });

      document.body.appendChild(portal);
      this._popupPortal = portal;

      const closeBtn = portal.querySelector('#closeBtn');
      if (closeBtn) closeBtn.addEventListener('click', () => this._closePopup());

      const historyBtn = portal.querySelector('#lockHistoryBtn');
      if (historyBtn) {
        historyBtn.addEventListener('click', () => {
          this._activeView = this._activeView === 'history' ? 'main' : 'history';
          const content = portal.querySelector('#lockContent');
          if (content) {
            content.innerHTML = this._renderLockPopupContent(entity, color, icon, stateText, sliderPosition, borderRadius, valueSize, valueWeight);
            if (this._activeView === 'history') {
              setTimeout(() => this._loadHistory(), 100);
            } else {
              this._setupLockHandlers(portal, entity);
            }
          }
        });
      }

      const openDoorBtn = portal.querySelector('#openDoorBtn');
      if (openDoorBtn) {
        openDoorBtn.addEventListener('click', () => {
          this.hass.callService('lock', 'open', { entity_id: this._config.entity });
        });
      }

      this._setupLockHandlers(portal, entity);
    }

    _renderLockPopupContent(entity, color, icon, stateText, sliderPosition, borderRadius, valueSize, valueWeight) {
      if (this._activeView === 'history') {
        return `<div class="timeline-container" data-view-type="history" id="historyContainer"><div class="history-loading">Loading Timeline...</div></div>`;
      }

      return `
        <div class="lock-slider-container">
          <div class="lock-state-display">${stateText}</div>
          <div class="lock-vertical-slider" id="lockSlider">
            <div class="lock-slider-fill"></div>
            <div class="lock-slider-thumb">
              <ha-icon icon="${icon}"></ha-icon>
            </div>
          </div>
        </div>
      `;
    }

    _setupLockHandlers(portal, entity) {
      if (this._activeView === 'history') return;

      const slider = portal.querySelector('#lockSlider');
      if (!slider) return;

      const isLocked = entity.state === 'locked';
      
      slider.addEventListener('click', (e) => {
        const rect = slider.getBoundingClientRect();
        const clickY = e.clientY - rect.top;
        const clickPercent = (rect.height - clickY) / rect.height;
        
        // Top half = lock, bottom half = unlock
        if (clickPercent > 0.5) {
          this.hass.callService('lock', 'lock', { entity_id: this._config.entity });
        } else {
          this.hass.callService('lock', 'unlock', { entity_id: this._config.entity });
        }
      });
    }

    _renderIndividualView() {
      const entity = this._getEntity();
      if (!entity || !entity.attributes.entity_id || !Array.isArray(entity.attributes.entity_id)) {
        return '<div style="padding: 20px; text-align: center; opacity: 0.6;">No individual lights found</div>';
      }

      let html = '<div class="individual-container" data-view-type="individual">';

      const pickDefaultMode = (child) => {
        const scm = child?.attributes?.supported_color_modes || [];
        const hasTemp = scm.includes('color_temp');
        const hasColor = scm.some(m => ['hs','rgb','xy','rgbw','rgbww'].includes(m));
        return hasTemp ? 'temp' : (hasColor ? 'color' : 'brightness');
      };

      entity.attributes.entity_id.forEach(entityId => {
        const childEntity = this.hass.states[entityId];
        if (!childEntity) return;

        const name = childEntity.attributes.friendly_name || entityId;
        const isOn = childEntity.state === 'on';
        const brightnessPct = childEntity.attributes.brightness ? Math.round((childEntity.attributes.brightness / 255) * 100) : 0;

        const scm = childEntity.attributes.supported_color_modes || [];
        const supportsTemp = scm.includes('color_temp');
        const supportsColor = scm.some(m => ['hs','rgb','xy','rgbw','rgbww'].includes(m));

        if (!this._groupMemberModes) this._groupMemberModes = {};
        if (!this._groupMemberModes[entityId]) this._groupMemberModes[entityId] = pickDefaultMode(childEntity);

        // Cycle order: brightness -> temp -> color -> brightness, skipping unsupported
        const mode = this._groupMemberModes[entityId];
        const nextMode = (() => {
          const order = ['brightness','temp','color'];
          let i = order.indexOf(mode);
          for (let step=0; step<3; step++) {
            i = (i+1) % order.length;
            const m = order[i];
            if (m==='temp' && !supportsTemp) continue;
            if (m==='color' && !supportsColor) continue;
            return m;
          }
          return 'brightness';
        })();

        const icon = mode === 'temp' ? 'mdi:thermometer' : (mode === 'color' ? 'mdi:palette' : 'mdi:lightbulb');

        // Slider value based on mode
        let pct = brightnessPct;
        let sliderKind = 'brightness';
        let gradient = '';
        if (mode === 'temp') {
          sliderKind = 'temp';
          const minM = childEntity.attributes.min_mireds || 153;
          const maxM = childEntity.attributes.max_mireds || 500;
          const ct = typeof childEntity.attributes.color_temp === 'number' ? childEntity.attributes.color_temp : minM;
          pct = Math.round(((ct - minM) / (maxM - minM)) * 100);
          gradient = 'background: linear-gradient(to right, #8ec5ff, #e8f0ff, #fff2c6, #ffd1a1);';
        } else if (mode === 'color') {
          sliderKind = 'color';
          const h = Array.isArray(childEntity.attributes.hs_color) ? childEntity.attributes.hs_color[0] : 0;
          pct = Math.round((h / 360) * 100);
          gradient = 'background: linear-gradient(to right, rgb(255,0,0), rgb(255,255,0), rgb(0,255,0), rgb(0,255,255), rgb(0,0,255), rgb(255,0,255), rgb(255,0,0));';
        }

        const memberColor = this._getCurrentColorFromState(childEntity);
        // For brightness mode, use the member's actual color if available, otherwise fall back to the classic gold.
        const brightnessFill = memberColor ? `${memberColor}` : 'rgba(255, 215, 0, 0.55)';

        html += `
          <div class="individual-item">
            <button class="individual-icon individual-mode-btn" data-entity="${entityId}" data-next="${nextMode}" title="Change mode">
              <ha-icon icon="${icon}"></ha-icon>
            </button>
            <div class="individual-info">
              <div class="individual-name">${name}</div>
              <div class="individual-state">${isOn ? brightnessPct + '%' : 'Off'}</div>
            </div>
            <div class="individual-slider" data-entity="${entityId}" data-mode="${sliderKind}" style="${gradient}">
              <div class="individual-slider-fill" style="width: ${pct}%; ${sliderKind==='brightness' ? `background: ${brightnessFill};` : ''}"></div>
              <div class="individual-slider-thumb" style="left: ${pct}%;"></div>
            </div>
          </div>
        `;
      });

      html += '</div>';

      // Save group favorite button (same placement as other save buttons)
      if (this._config.popup_show_favorites !== false) {
        html += `
          <button class="save-favorite-fab" id="saveGroupFavoriteBtn" title="Save group favorite">
            <ha-icon icon="mdi:star-plus"></ha-icon>
          </button>
        `;
      }

      return html;
    }


    _renderEffectsView(effectList, currentEffect) {
      let html = '<div class="effects-list-container" data-view-type="effects">';
      
      if (!effectList || effectList.length === 0) {
        html += '<div style="padding: 40px 20px; text-align: center; opacity: 0.6; font-size: 14px;">No effects available for this device</div>';
      } else {
        html += '<div class="effects-list expanded">';
        html += `<div class="effect-item ${currentEffect === 'None' || !currentEffect ? 'active' : ''}" data-effect="None">No Effect</div>`;
        effectList.forEach(effect => {
          html += `<div class="effect-item ${effect === currentEffect ? 'active' : ''}" data-effect="${effect}">${effect}</div>`;
        });
        html += '</div>';
      }
      
      html += '</div>';
      return html;
    }

    _setInitialColorIndicator() {
      const colorWheel = this._popupPortal ? this._popupPortal.querySelector('#colorWheel') : null;
      const indicator = this._popupPortal ? this._popupPortal.querySelector('#colorIndicator') : null;
      
      if (colorWheel && indicator) {
        const rect = colorWheel.getBoundingClientRect();
        
        if (rect.width === 0 || rect.height === 0) {
          setTimeout(() => this._setInitialColorIndicator(), 50);
          return;
        }
        
        const r = rect.width / 2;
        const hue = this._hue || 0;
        const saturation = Math.min(100, Math.max(0, this._saturation || 0));
        
        const theta = (hue - 90) * (Math.PI / 180);
        const dist = (saturation / 100) * r;
        
        const x = r + (dist * Math.cos(theta));
        const y = r + (dist * Math.sin(theta));
        
        indicator.style.left = x + 'px';
        indicator.style.top = y + 'px';
        indicator.style.background = 'hsl(' + hue + ', ' + saturation + '%, 50%)';
      }
    }

    _setupPopupHandlers(portal) {
      if (this._getDomain() === 'climate') {
          this._setupClimateHandlers(portal);
          return; // Skip light handlers
      }
      const closeBtn = portal.querySelector('#closeBtn');
      if (closeBtn) closeBtn.addEventListener('click', () => this._closePopup());

      const individualLightsBtn = portal.querySelector('#individualLightsBtn');
      if (individualLightsBtn) {
        individualLightsBtn.addEventListener('click', () => {
          portal.querySelectorAll('.hki-light-popup-tab').forEach(t => t.classList.remove('active'));
          
          const content = portal.querySelector('.hki-light-popup-content');
          if (content) {
            const currentView = content.querySelector('[data-view-type]')?.dataset.viewType;
            if (currentView === 'individual') {
              this._renderPopupPortal();
            } else {
              content.innerHTML = this._renderIndividualView();
              this._setupContentHandlers(portal);
            }
          }
        });
      }

      const historyBtn = portal.querySelector('#historyBtn');
      if (historyBtn) {
        historyBtn.addEventListener('click', () => {
          portal.querySelectorAll('.hki-light-popup-tab').forEach(t => t.classList.remove('active'));
          
          const content = portal.querySelector('.hki-light-popup-content');
          if (content) {
            const currentView = content.querySelector('[data-view-type]')?.dataset.viewType;
            if (currentView === 'history') {
              this._renderPopupPortal();
            } else {
              content.innerHTML = `<div class="timeline-container" data-view-type="history" id="historyContainer">
                <div class="history-loading">Loading Timeline...</div>
              </div>`;
              setTimeout(() => this._loadHistory(), 100);
            }
          }
        });
      }

      const scenesBtn = portal.querySelector('#scenesBtn');
      if (scenesBtn) {
        scenesBtn.addEventListener('click', () => {
          portal.querySelectorAll('.hki-light-popup-tab').forEach(t => t.classList.remove('active'));
          scenesBtn.classList.add('active');
          this._activeView = 'favorites';
          
          const content = portal.querySelector('.hki-light-popup-content');
          if (content) {
            content.classList.add('view-favorites');
            content.innerHTML = this._renderFavoritesView();
            this._setupContentHandlers(portal);
          }
        });
      }

      const effectsBtn = portal.querySelector('#effectsBtn');
      if (effectsBtn) {
        effectsBtn.addEventListener('click', () => {
          portal.querySelectorAll('.hki-light-popup-tab').forEach(t => t.classList.remove('active'));
          effectsBtn.classList.add('active');
          this._activeView = 'effects';
          
          const entity = this._getEntity();
          const effectList = entity && entity.attributes.effect_list ? entity.attributes.effect_list : [];
          const currentEffect = entity && entity.attributes.effect ? entity.attributes.effect : 'None';
          const content = portal.querySelector('.hki-light-popup-content');
          if (content) {
            content.innerHTML = this._renderEffectsView(effectList, currentEffect);
            this._setupContentHandlers(portal);
          }
        });
      }

      // Bottom navigation
      const powerBtn = portal.querySelector('#powerBtn');
      if (powerBtn) {
        powerBtn.addEventListener('click', () => {
          this.hass.callService('light', 'toggle', { entity_id: this._config.entity });
        });
      }

      const brightnessBtn = portal.querySelector('#brightnessBtn');
      if (brightnessBtn) {
        brightnessBtn.addEventListener('click', () => {
          portal.querySelectorAll('.hki-light-popup-tab').forEach(t => t.classList.remove('active'));
          this._activeView = 'brightness';
          this._renderPopupPortal();
        });
      }

      const temperatureBtn = portal.querySelector('#temperatureBtn');
      if (temperatureBtn) {
        temperatureBtn.addEventListener('click', () => {
          portal.querySelectorAll('.hki-light-popup-tab').forEach(t => t.classList.remove('active'));
          this._activeView = 'temperature';
          this._syncState();
          this._renderPopupPortal();
        });
      }

      const colorBtn = portal.querySelector('#colorBtn');
      if (colorBtn) {
        colorBtn.addEventListener('click', () => {
          portal.querySelectorAll('.hki-light-popup-tab').forEach(t => t.classList.remove('active'));
          this._activeView = 'color';
          this._syncState();
          this._renderPopupPortal();
        });
      }
    }

    _setupClimateHandlers(portal) {
        // 1. Sliders
        portal.querySelectorAll('.vertical-slider-track').forEach(track => {
            const type = track.dataset.type; // 'single', 'low', 'high'
            const update = (e) => {
                 const rect = track.getBoundingClientRect();
                 const y = Math.max(0, Math.min(1, 1 - (e.clientY - rect.top) / rect.height));
                 let val = this._tempMin + (y * (this._tempMax - this._tempMin));
                 val = Math.round(val / this._step) * this._step;
                 val = Math.round(val * 10) / 10;
                 
                 // UI Update logic (height %, text content) goes here
                 // Same as the climate code provided previously
                 
                 return val;
            };
            // Add mousedown/touchstart listeners similar to light slider...
        });
    
        // 2. Nav Buttons
        const entity = this._getEntity();
        (entity.attributes.hvac_modes || []).forEach(m => {
            const btn = portal.querySelector(`#mode-${m}`);
            if(btn) btn.addEventListener('click', () => {
                 // Optimistic UI: highlight immediately
                 this._optimisticHvacMode = m;
                 portal.querySelectorAll('button[id^="mode-"]').forEach(b => {
                   b.classList.remove('active');
                   b.style.color = '';
                 });
                 btn.classList.add('active');
                 if (HVAC_COLORS && HVAC_COLORS[m]) btn.style.color = HVAC_COLORS[m];

                 this.hass.callService('climate', 'set_hvac_mode', {
                     entity_id: this._config.entity, hvac_mode: m
                 });
                 // Re-render shortly to keep UI consistent with other elements
                 setTimeout(() => this._renderPopupPortal(), 200);
            });
        });
    }

    _setupContentHandlers(portal) {
      // Brightness slider
      const brightnessTrack = portal.querySelector('#brightnessTrack');
      if (brightnessTrack) {
        const self = this;
        const updateBrightness = (e) => {
          self._isDragging = true;
          const rect = brightnessTrack.getBoundingClientRect();
          const y = Math.max(0, Math.min(1, 1 - (e.clientY - rect.top) / rect.height));
          const brightness = Math.round(y * 100);
          self._brightness = brightness;
          
          const fill = brightnessTrack.querySelector('.vertical-slider-fill');
          const thumb = brightnessTrack.querySelector('.vertical-slider-thumb');
          const valueDisplay = portal.querySelector('.value-display');
          
          if (fill) {
            fill.style.height = brightness + '%';
            if (self._config.dynamic_bar_color) {
              fill.style.background = self._getCurrentColor();
            }
          }
          if (thumb) thumb.style.bottom = 'calc(' + brightness + '% - 6px)';
          if (valueDisplay) valueDisplay.innerHTML = brightness + '<span>%</span>';
        };

        const finishBrightness = () => {
          document.removeEventListener('mousemove', updateBrightness);
          document.removeEventListener('mouseup', finishBrightness);
          document.removeEventListener('touchmove', handleTouch);
          document.removeEventListener('touchend', finishBrightness);
          
          self._isDragging = false;
          if (self._brightness > 0) {
            self.hass.callService('light', 'turn_on', { entity_id: self._config.entity, brightness_pct: self._brightness });
          } else {
            self.hass.callService('light', 'turn_off', { entity_id: self._config.entity });
          }
        };

        const handleTouch = (e) => { e.preventDefault(); updateBrightness(e.touches[0]); };

        brightnessTrack.addEventListener('mousedown', (e) => {
          updateBrightness(e);
          document.addEventListener('mousemove', updateBrightness);
          document.addEventListener('mouseup', finishBrightness);
        });
        brightnessTrack.addEventListener('touchstart', (e) => {
          handleTouch(e);
          document.addEventListener('touchmove', handleTouch, { passive: false });
          document.addEventListener('touchend', finishBrightness);
        });
      }

      // Temperature slider
      const tempTrackVertical = portal.querySelector('#tempTrackVertical');
      if (tempTrackVertical) {
        const self = this;
        const updateTemp = (e) => {
          self._isDragging = true;
          const rect = tempTrackVertical.getBoundingClientRect();
          const y = Math.max(0, Math.min(1, 1 - (e.clientY - rect.top) / rect.height));
          const range = self._tempMax - self._tempMin;
          const mireds = Math.round(self._tempMax - (y * range));
          self._currentTemp = mireds;
          const kelvin = Math.round(1000000 / mireds);
          
          const fill = tempTrackVertical.querySelector('.vertical-slider-fill');
          const thumb = tempTrackVertical.querySelector('.vertical-slider-thumb');
          const valueDisplay = portal.querySelector('.value-display');
          
          const tempPct = 100 - (((mireds - self._tempMin) / range) * 100);
          if (fill) fill.style.height = tempPct + '%';
          if (thumb) thumb.style.bottom = 'calc(' + tempPct + '% - 6px)';
          if (valueDisplay) valueDisplay.textContent = self._getTempName(kelvin);
        };

        const finishTemp = () => {
          document.removeEventListener('mousemove', updateTemp);
          document.removeEventListener('mouseup', finishTemp);
          document.removeEventListener('touchmove', handleTouchTemp);
          document.removeEventListener('touchend', finishTemp);
          
          self._isDragging = false;
          self.hass.callService('light', 'turn_on', { entity_id: self._config.entity, color_temp: self._currentTemp });
        };

        const handleTouchTemp = (e) => { e.preventDefault(); updateTemp(e.touches[0]); };

        tempTrackVertical.addEventListener('mousedown', (e) => {
          updateTemp(e);
          document.addEventListener('mousemove', updateTemp);
          document.addEventListener('mouseup', finishTemp);
        });
        tempTrackVertical.addEventListener('touchstart', (e) => {
          handleTouchTemp(e);
          document.addEventListener('touchmove', handleTouchTemp, { passive: false });
          document.addEventListener('touchend', finishTemp);
        });
      }

      // Color wheel
      const colorWheel = portal.querySelector('#colorWheel');
      if (colorWheel) {
        const self = this;
        const updateColor = (e) => {
          self._isDragging = true;
          const rect = colorWheel.getBoundingClientRect();
          const centerX = rect.width / 2;
          const centerY = rect.height / 2;
          
          const clientX = e.clientX || (e.touches ? e.touches[0].clientX : 0);
          const clientY = e.clientY || (e.touches ? e.touches[0].clientY : 0);
          
          const x = clientX - rect.left - centerX;
          const y = clientY - rect.top - centerY;
          
          let angle = Math.atan2(y, x) * (180 / Math.PI) + 90;
          if (angle < 0) angle += 360;
          const distance = Math.min(1, Math.sqrt(x * x + y * y) / (rect.width / 2));
          
          self._hue = angle;
          self._saturation = distance * 100;
          
          const indicator = portal.querySelector('#colorIndicator');
          const colorNameEl = portal.querySelector('.value-display');
          if (indicator) {
            const r = distance * (rect.width / 2);
            const theta = (angle - 90) * Math.PI / 180;
            const indicatorX = centerX + r * Math.cos(theta);
            const indicatorY = centerY + r * Math.sin(theta);
            
            indicator.style.left = indicatorX + 'px';
            indicator.style.top = indicatorY + 'px';
            indicator.style.background = 'hsl(' + self._hue + ', ' + self._saturation + '%, 50%)';
            indicator.style.transition = 'none';
          }
          if (colorNameEl) {
            colorNameEl.textContent = self._getColorName(self._hue, self._saturation);
          }
        };

        const finishColor = () => {
          document.removeEventListener('mousemove', updateColor);
          document.removeEventListener('mouseup', finishColor);
          document.removeEventListener('touchmove', handleTouchColor);
          document.removeEventListener('touchend', finishColor);
          self._isDragging = false;
          self.hass.callService('light', 'turn_on', { entity_id: self._config.entity, hs_color: [self._hue, self._saturation] });
          const indicator = portal.querySelector('#colorIndicator');
          if (indicator) indicator.style.transition = 'top 0.3s, left 0.3s';
        };
        
        const handleTouchColor = (e) => { e.preventDefault(); updateColor(e); };

        colorWheel.addEventListener('mousedown', (e) => {
          updateColor(e);
          document.addEventListener('mousemove', updateColor);
          document.addEventListener('mouseup', finishColor);
        });
        
        colorWheel.addEventListener('touchstart', (e) => {
          handleTouchColor(e);
          document.addEventListener('touchmove', handleTouchColor, { passive: false });
          document.addEventListener('touchend', finishColor);
        });
      }

      // Preset buttons
      const presetBtns = portal.querySelectorAll('.preset-btn');
      const self = this;
      presetBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation(); 
          if (self._favoritesEditMode) return;
          const idx = parseInt(btn.dataset.favIndex);
          if (Number.isNaN(idx)) return;
          self._ensureLightFavorites();
          const fav = Array.isArray(self._lightFavorites) ? self._lightFavorites[idx] : null;
          if (!fav) return;
          self._applyFavorite(fav);
        });
      });

      // Favorites edit toggle
      const favEditBtn = portal.querySelector('#favoritesEditBtn');
      if (favEditBtn) {
        favEditBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this._favoritesEditMode = !this._favoritesEditMode;
          const content = portal.querySelector('.hki-light-popup-content');
          if (content) {
            content.classList.add('view-favorites');
            content.innerHTML = this._renderFavoritesView();
            this._setupContentHandlers(portal);
          }
        });
      }

      // Favorites delete badges
      const delBadges = portal.querySelectorAll('.fav-delete-badge');
      delBadges.forEach(b => {
        b.addEventListener('click', (e) => {
          e.stopPropagation();
          const idx = parseInt(b.dataset.favDel);
          if (Number.isNaN(idx)) return;
          this._ensureLightFavorites();
          if (Array.isArray(this._lightFavorites)) {
            this._lightFavorites.splice(idx, 1);
            this._saveLightFavorites();
          }
          const content = portal.querySelector('.hki-light-popup-content');
          if (content) {
            content.classList.add('view-favorites');
            content.innerHTML = this._renderFavoritesView();
            this._setupContentHandlers(portal);
          }
        });
      });

      // Save favorite button (color wheel / color temp)
      const saveFavBtn = portal.querySelector('#saveFavoriteBtn');
      if (saveFavBtn) {
        saveFavBtn.addEventListener('click', async (e) => {
          e.stopPropagation();
          await this._addCurrentLightToFavorites();
          
          // Switch to favorites tab and show the updated list
          this._activeView = 'favorites';
          const content = portal.querySelector('.hki-light-popup-content');
          const scenesBtn = portal.querySelector('#scenesBtn');
          
          if (content) {
            content.classList.add('view-favorites');
            content.innerHTML = this._renderFavoritesView();
            this._setupContentHandlers(portal);
          }
          
          // Update tab active states
          if (scenesBtn) {
            portal.querySelectorAll('.hki-light-popup-tab').forEach(t => t.classList.remove('active'));
            scenesBtn.classList.add('active');
          }
        });
      }

      // Group member mode buttons
      const modeBtns = portal.querySelectorAll('.individual-mode-btn');
      modeBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const eid = btn.dataset.entity;
          const next = btn.dataset.next || 'brightness';
          if (!this._groupMemberModes) this._groupMemberModes = {};
          this._groupMemberModes[eid] = next;
          // Re-render only the individual view
          const content = portal.querySelector('.hki-light-popup-content');
          if (content) {
            content.innerHTML = this._renderIndividualView();
            this._setupContentHandlers(portal);
          }
        });
      });

      // Save group favorite button
      const saveGroupBtn = portal.querySelector('#saveGroupFavoriteBtn');
      if (saveGroupBtn) {
        saveGroupBtn.addEventListener('click', async (e) => {
          e.stopPropagation();
          await this._addGroupSnapshotToFavorites({ alwaysPromptMeta: true });
          const content = portal.querySelector('.hki-light-popup-content');
          if (content) {
            content.classList.add('view-favorites');
            content.innerHTML = this._renderFavoritesView();
            this._setupContentHandlers(portal);
          }
        });
      }

      // Individual sliders
      const individualSliders = portal.querySelectorAll('.individual-slider');
      individualSliders.forEach(slider => {
        const entityId = slider.dataset.entity;
        const mode = slider.dataset.mode || 'brightness';

        const calcPct = (clientX) => {
          const rect = slider.getBoundingClientRect();
          const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
          return Math.round(x * 100);
        };

        const applyVisual = (pct) => {
          const fill = slider.querySelector('.individual-slider-fill');
          const thumb = slider.querySelector('.individual-slider-thumb');
          if (fill) fill.style.width = pct + '%';
          if (thumb) thumb.style.left = pct + '%';
        };

        const finish = async (clientX) => {
          const pct = calcPct(clientX);
          applyVisual(pct);

          const st = this.hass.states[entityId];
          if (!st) return;
          const a = st.attributes || {};

          if (mode === 'temp') {
            const minM = a.min_mireds || 153;
            const maxM = a.max_mireds || 500;
            const ct = Math.round(minM + ((maxM - minM) * (pct / 100)));
            await this.hass.callService('light', 'turn_on', { entity_id: entityId, color_temp: ct });
          } else if (mode === 'color') {
            const hue = Math.round((pct / 100) * 360);
            await this.hass.callService('light', 'turn_on', { entity_id: entityId, hs_color: [hue, 100] });
          } else {
            if (pct > 0) {
              await this.hass.callService('light', 'turn_on', { entity_id: entityId, brightness_pct: pct });
            } else {
              await this.hass.callService('light', 'turn_off', { entity_id: entityId });
            }
          }
        };

        let isDragging = false;
        const onMove = (e) => {
          if (!isDragging) return;
          const clientX = (e.touches && e.touches[0]) ? e.touches[0].clientX : e.clientX;
          const pct = calcPct(clientX);
          applyVisual(pct);
        };
        const onUp = async (e) => {
          if (!isDragging) return;
          isDragging = false;
          document.removeEventListener('mousemove', onMove);
          document.removeEventListener('mouseup', onUp);
          document.removeEventListener('touchmove', onMove);
          document.removeEventListener('touchend', onUp);
          const clientX = (e.changedTouches && e.changedTouches[0]) ? e.changedTouches[0].clientX : e.clientX;
          await finish(clientX);
        };

        const onDown = (e) => {
          isDragging = true;
          const clientX = (e.touches && e.touches[0]) ? e.touches[0].clientX : e.clientX;
          const pct = calcPct(clientX);
          applyVisual(pct);
          document.addEventListener('mousemove', onMove);
          document.addEventListener('mouseup', onUp);
          document.addEventListener('touchmove', onMove, { passive: true });
          document.addEventListener('touchend', onUp);
        };

        slider.addEventListener('mousedown', onDown);
        slider.addEventListener('touchstart', onDown, { passive: true });
      });

      // Effects toggle and items
      const effectsTrigger = portal.querySelector('#effectsTrigger');
      if (effectsTrigger) {
        effectsTrigger.addEventListener('click', () => {
          this._expandedEffects = !this._expandedEffects;
          const effectsList = portal.querySelector('.effects-list');
          const arrow = portal.querySelector('.effects-trigger-arrow');
          if (effectsList) {
            effectsList.classList.toggle('expanded');
          }
          if (arrow) {
            arrow.classList.toggle('expanded');
          }
        });
      }

      const effectItems = portal.querySelectorAll('.effect-item');
      effectItems.forEach(item => {
        item.addEventListener('click', () => {
          const effect = item.dataset.effect;
          if (effect === 'None') {
            self.hass.callService('light', 'turn_on', { entity_id: self._config.entity, effect: 'none' });
          } else {
            self.hass.callService('light', 'turn_on', { entity_id: self._config.entity, effect: effect });
          }
        });
      });
    }

    async _loadHistory() {
      const container = this._popupPortal.querySelector('#historyContainer');
      if (!container) return;

      const entityId = this._config.entity;
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - 24 * 60 * 60 * 1000);
      
      try {
        const logbook = await this.hass.callApi('GET', `logbook/${startTime.toISOString()}?entity=${entityId}&end_time=${endTime.toISOString()}`);
        
        if (!logbook || logbook.length === 0) {
          container.innerHTML = '<div class="history-loading">No history available</div>';
          return;
        }

        const domain = this._getDomain();
        const stateChanges = logbook
          .filter(entry => {
            // alarm_control_panel entries (Alarmo) often have message instead of state
            if (domain === 'alarm_control_panel') {
              const hasState = !!entry.state && entry.state !== 'unknown';
              const hasMsg = !!entry.message && String(entry.message).trim() !== '';
              return hasState || hasMsg
            }
            if (!entry.state) return false;
            if (domain === 'climate') return entry.state !== 'unknown';
            if (domain === 'cover') return entry.state !== 'unknown';
            return (entry.state === 'on' || entry.state === 'off' || entry.state === 'unavailable');
          })
          .reverse()
          .slice(0, 15);
        
        let htmlContent = '';
        
        stateChanges.forEach((entry, index) => {
          const date = new Date(entry.when);
          const timeStr = this._formatHistoryTime(date);
          const ago = this._getTimeAgo(date);
          
          let stateText = 'Changed';
          
          if (domain === 'alarm_control_panel') {
            // Alarmo often logs message; prefer that, else state
            const raw = entry.message ?? entry.state ?? 'changed';
            const norm = String(raw)
              .replace(/_/g, ' ')
              .replace(/\s+/g, ' ')
              .trim();
            stateText = this._titleCase(norm);
          } else if (entry.state === 'on') {
            stateText = 'Turned On';
          } else if (entry.state === 'off') {
            stateText = 'Turned Off';
          } else if (entry.state === 'unavailable') {
            stateText = 'Unavailable';
          } else if (entry.state) {
            stateText = this._titleCase(entry.state);
          }

          
          // --- FIX: USER RESOLUTION VIA PERSON ENTITIES ---
          let trigger = 'System';
          
          if (entry.context_user_id) {
             // 1. Try to find a "person" entity that matches this user_id
             const person = Object.values(this.hass.states).find(state => 
                state.entity_id.startsWith('person.') && 
                state.attributes.user_id === entry.context_user_id
             );
             
             if (person && person.attributes.friendly_name) {
                trigger = person.attributes.friendly_name;
             } 
             // 2. Fallback: Check if it matches the currently logged-in user
             else if (this.hass.user && this.hass.user.id === entry.context_user_id) {
                trigger = this.hass.user.name;
             } 
             else {
                trigger = 'User'; // ID exists but couldn't resolve name
             }
          } else {
             // If no user ID, check if the entry name differs from the entity name
             // (This often catches automations or scenes depending on how they log)
             const entityName = this._config.name || this.hass.states[entityId]?.attributes?.friendly_name;
             if (entry.name && entry.name !== entityName && entry.name !== entityId) {
                trigger = entry.name;
             }
          }
          // ------------------------------------------------
          
          const dotColor = (domain === 'alarm_control_panel')
            ? (() => {
                const raw = (entry.state ? String(entry.state) : (entry.message ? String(entry.message) : '')).toLowerCase();
                if (raw.includes('disarm')) return '#4CAF50';
                if (raw.includes('trigger')) return '#E53935';
                if (raw.includes('armed') || raw.includes('arm')) return '#FF9800';
                return '#2196F3';
              })()
            : (domain === 'climate')
              ? ((HVAC_COLORS && HVAC_COLORS[entry.state]) || (entry.state === 'off' ? '#444' : '#FFD700'))
              : (domain === 'cover')
                ? (entry.state === 'closed' ? '#444' : '#2196F3')
                : (entry.state === 'on' ? '#FFD700' : (entry.state === 'off' ? '#444' : '#E53935'));          
          htmlContent += `
            <div class="timeline-item">
              <div class="timeline-time">${timeStr}</div>
              <div class="timeline-visual">
                <div class="timeline-dot" style="background: ${dotColor}"></div>
                <div class="timeline-line"></div>
              </div>
              <div class="timeline-content">
                <strong>${stateText}</strong>
                <span class="timeline-ago">${ago}</span>
                <span class="timeline-trigger">${trigger}</span>
              </div>
            </div>
          `;
        });
        container.innerHTML = htmlContent;
      } catch (err) {
        console.error("Error fetching history", err);
        container.innerHTML = '<div class="history-loading">Error loading history</div>';
      }
    }

    _titleCase(str) {
      return String(str)
        .toLowerCase()
        .replace(/\b\w/g, c => c.toUpperCase());
    }

    _getTimeAgo(date) {
      const now = new Date();
      const diff = now - date;
      const seconds = Math.floor(diff / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);
      
      if (days > 0) return days === 1 ? '1 day ago' : `${days} days ago`;
      if (hours > 0) return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
      if (minutes > 0) return minutes === 1 ? '1 minute ago' : `${minutes} minutes ago`;
      return 'Just now';
    }

    _formatLastTriggered(entity) {
      if (!entity || !entity.last_changed) {
        return '';
      }
      const lastChanged = new Date(entity.last_changed);
      if (isNaN(lastChanged.getTime())) {
        return '';
      }
      return this._getTimeAgo(lastChanged);
    }

    
    _getClimateBadgeTemperature(entity) {
      // Optional override entity for the small temperature bubble.
      const overrideId = this._config.climate_current_temperature_entity;
      if (overrideId && this.hass && this.hass.states && this.hass.states[overrideId]) {
        const st = this.hass.states[overrideId].state;
        const num = Number(st);
        if (!Number.isNaN(num)) return num;
        // If it's not numeric (e.g. 'unknown'), fall through to default.
      }
      const v = entity?.attributes?.current_temperature;
      return (v === undefined || v === null) ? null : v;
    }


    _getTempUnit(entity) {
      const unit = entity?.attributes?.temperature_unit
        || this.hass?.config?.unit_system?.temperature
        || '°C';
      // HA typically returns "°C"/"°F" already; if not, normalize.
      if (unit === 'C' || unit === 'c') return '°C';
      if (unit === 'F' || unit === 'f') return '°F';
      return unit;
    }

    _renderClimateCornerBadge(entity, isOn, iconColor, badgeBorder, badgeBg, getTransform) {
      if (this._getDomain() !== 'climate') return '';
      if (this._config.show_temp_badge === false) return '';
      const tempVal = this._getClimateBadgeTemperature(entity);
      if (tempVal === null || tempVal === undefined || tempVal === '' || Number.isNaN(Number(tempVal))) return '';

      const unit = this._getTempUnit(entity);

      // Temperature badge specific config (falls back to icon badge config)
      const size = this._config.temp_badge_size ?? this._config.badge_size ?? 33;
      const fontSize = this._config.size_temp_badge ?? this._config.size_badge ?? 9;

      const textColor = this._config.temp_badge_text_color ?? 'white';

      const border = (() => {
        const w = this._config.temp_badge_border_width ?? this._config.badge_border_width;
        const st = this._config.temp_badge_border_style ?? this._config.badge_border_style ?? 'none';
        const c = this._config.temp_badge_border_color ?? this._config.badge_border_color ?? 'transparent';
        const _toUnit = (v) => (v === undefined || v === null || v === '') ? '0px' : (String(v).match(/[a-z%]+$/) ? String(v) : `${v}px`);
        return `${_toUnit(w)} ${st} ${c}`;
      })();

      const borderRadius = (() => {
        const r = this._config.temp_badge_border_radius ?? this._config.badge_border_radius ?? (size / 2);
        return (r === undefined || r === null || r === '') ? '0px' : (String(r).match(/[a-z%]+$/) ? String(r) : `${r}px`);
      })();

      const boxShadow = this._config.temp_badge_box_shadow ?? this._config.badge_box_shadow ?? '';

      const bubbleColor = isOn ? iconColor : '#888';

      const x = (this._config.temp_badge_offset_x ?? this._config.badge_offset_x) || 0;
      const y = (this._config.temp_badge_offset_y ?? this._config.badge_offset_y) || 0;

      const fontFamily = (this._config.temp_badge_font_family === 'custom')
        ? this._config.temp_badge_font_custom
        : (this._config.temp_badge_font_family || this._config.badge_font_family || 'system-ui');

      const fontWeight = this._config.temp_badge_font_weight || this._config.badge_font_weight || '500';

      return html`
        <div class="badge climate-corner-badge" style="
          width: ${size}px; height: ${size}px;
          background: ${bubbleColor};
          border: ${border};
          border-radius: ${borderRadius};
          box-shadow: ${boxShadow};
          color: ${textColor};
          font-size: ${fontSize}px;
          font-family: ${fontFamily};
          font-weight: ${fontWeight};
          transform: translate(${x}px, ${y}px);
        ">
          ${tempVal}${unit}
        </div>
      `;
    }

    
    _renderBadge(entity, isOn, iconColor, badgeBorder, badgeBg, badgeCount, getTransform) {
      // Light group count badge
      if (badgeCount > 0) {
        return html`
          <div class="badge" style="
            font-size: ${this._config.size_badge || 10}px;
            background: ${badgeBg};
            border: ${badgeBorder};
            transform: ${getTransform(this._config.badge_offset_x, this._config.badge_offset_y)};
          ">
            ${badgeCount}
          </div>
        `;
      }

      return '';
    }



/* --- TILE RENDER LOGIC --- */

    render() {
      const entity = this._getEntity();
      if (!entity) return html`<ha-card>Entity not found</ha-card>`;

      const isOn = this._isOn();
      
      // -- Typography Helper --
      const getFont = (family, weight, size) => {
          let f = family || 'inherit';
          if (f === 'system') f = 'inherit';
          else if (f === 'custom') f = this._config[`${family}_custom`] || 'inherit';
          
          let w = weight || 'normal';
          return `font-family: ${f}; font-weight: ${w}; font-size: ${size || 12}px;`;
      };

      // -- Unit Helper (Fix for "border: 2 solid" bug) --
      const _toUnit = (v) => (!v ? '0px' : (isNaN(v) ? v : `${v}px`));

      // -- Layout & Shape --
      const layout = this._config.card_layout || 'square'; 
      
      // -- Colors --
      const haDefaultBg = 'var(--ha-card-background, var(--card-background-color))';
      
      // Light color (only meaningful for light domain; safe to call anyway)
      const currentLightColor = this._getCurrentColor?.() || null;
      
      // If you only want "auto" for the ON state:
      const bgColor =
        isOn
          ? (
              (this._config.card_color_on === 'auto' && this._getDomain() === 'light' && currentLightColor)
                ? currentLightColor
                : (this._config.card_color_on || '#f0f0f0')
            )
          : (this._config.card_color_off || haDefaultBg);
      
      // Apply opacity if configured
      const cardOpacity = isOn 
        ? (this._config.card_opacity_on !== undefined ? this._config.card_opacity_on : 1)
        : (this._config.card_opacity_off !== undefined ? this._config.card_opacity_off : 1);
      
      let boxShadow;
      const shadowSetting = this._config.box_shadow;
      
      if (!shadowSetting || shadowSetting === 'default') {
        boxShadow = ''; // unset -> theme default
      } else if (shadowSetting === 'none') {
        boxShadow = 'none';
      } else if (shadowSetting === 'auto') {
        boxShadow = (currentLightColor) ? `0 8px 24px ${currentLightColor}` : '';
      } else if (shadowSetting === 'custom') {
        boxShadow = this._config.box_shadow_custom || '';
      } else {
        // if user directly stored a CSS shadow string in box_shadow
        boxShadow = shadowSetting;
      }

      // Individual Element Colors - DEFAULT TO BLACK (#000000) IF ON, INHERIT IF OFF
      const nameColor = isOn ? (this._config.name_color_on || '#000000') : (this._config.name_color_off || 'inherit');
      const stateColor = isOn ? (this._config.state_color_on || '#000000') : (this._config.state_color_off || 'inherit');
      const labelColor = isOn ? (this._config.label_color_on || '#000000') : (this._config.label_color_off || 'inherit');

      let iconColor = this._config.icon_color_off || 'var(--paper-item-icon-color)';
      
      if (isOn) {
        if (this._getDomain() === 'climate') {
          const mode = entity?.state; // e.g. "heat", "cool", "off"
          iconColor = (HVAC_COLORS && HVAC_COLORS[mode]) || HVAC_COLORS?.off || iconColor;
        } else {
          // Existing light logic (unchanged)
          if (!this._config.icon_color_on || this._config.icon_color_on === 'auto') {
            iconColor = this._getCurrentColor();
          } else {
            iconColor = this._config.icon_color_on;
          }
        }
      }

      // -- Borders (Fixed with _toUnit) --
      // Card Border
      const cardBorder = `${_toUnit(this._config.border_width)} ${this._config.border_style || 'none'} ${this._config.border_color || 'transparent'}`;
      
      // Icon Circle Styling
      const iconCircleBorder = `${_toUnit(this._config.icon_circle_border_width)} ${this._config.icon_circle_border_style || 'none'} ${this._config.icon_circle_border_color || 'transparent'}`;
      const iconCircleBg = isOn 
        ? (this._config.icon_circle_bg_on || 'rgba(0,0,0,0.05)') 
        : (this._config.icon_circle_bg_off || 'rgba(128,128,128,0.15)');

      // Badge Styling
      const badgeBorder = `${_toUnit(this._config.badge_border_width)} ${this._config.badge_border_style || 'none'} ${this._config.badge_border_color || 'transparent'}`;
      const badgeBg = isOn ? (this._config.badge_bg_on || 'var(--primary-color)') : (this._config.badge_bg_off || 'var(--primary-color)');

      // -- Offsets --
      const getTransform = (x, y) => `translate(${x || 0}px, ${y || 0}px)`;

      // -- Data --
      const nameText = this._renderedName || this._config.name || entity.attributes.friendly_name;
      let stateText = this._renderedState || this._config.state_label;
      if (!stateText) {
        const domain = this._getDomain();
        const pretty = (s) => String(s || '').replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
        if (domain === 'climate') {
          // Show HVAC mode (heat/cool/auto/...) or Off
          stateText = (entity.state === 'off') ? 'Off' : pretty(entity.state);
        } else if (domain === 'cover') {
          // Show Open/Closed for covers (treat opening/closing/stopped as Open)
          stateText = (entity.state === 'closed') ? 'Closed' : 'Open';
        } else {
          stateText = pretty(entity.state);
        }
      }
      const labelText = this._renderedLabel || this._config.label || "";
      
      const isGroup = entity.attributes.entity_id && Array.isArray(entity.attributes.entity_id);
      const badgeCount = isGroup
        ? (entity.attributes.entity_id || []).filter((id) => this.hass?.states?.[id]?.state === 'on').length
        : 0;
      
      const animClass = (isOn && this._config.icon_animation) ? `animate-${this._config.icon_animation}` : '';

      // Custom Font Logic for specific fields
      const nameFont = this._config.name_font_family === 'custom' ? this._config.name_font_custom : this._config.name_font_family;
      const stateFont = this._config.state_font_family === 'custom' ? this._config.state_font_custom : this._config.state_font_family;
      const labelFont = this._config.label_font_family === 'custom' ? this._config.label_font_custom : this._config.label_font_family;

      // New Brightness Font Logic
      const brightnessFont = this._config.brightness_font_family === 'custom' ? this._config.brightness_font_custom : this._config.brightness_font_family;

      return html`
        <ha-card 
          class="hki-tile ${isOn ? 'on' : 'off'} layout-${layout}"
          style="
            background: ${bgColor};
            opacity: ${cardOpacity};
            border-radius: ${this._config.border_radius ?? 12}px !important;
            box-shadow: ${this._config.box_shadow || 'none'} !important;
            border: ${cardBorder} !important;
            --icon-color: ${iconColor} !important;
          "
          @click=${() => this._handleDelayClick(this._config.tap_action || { action: "toggle" }, this._config.double_tap_action || { action: "hki-more-info" })}
          @dblclick=${() => this._handleAction(this._config.double_tap_action || { action: "hki-more-info" })}
          @mousedown=${(e) => this._startHold(e, this._config.hold_action || { action: "hki-more-info" })}
          @mouseup=${() => this._clearHold()}
          @mouseleave=${() => this._clearHold()}
          @touchstart=${(e) => this._startHold(e, this._config.hold_action || { action: "hki-more-info" })}
          @touchend=${() => this._clearHold()}
          @touchcancel=${() => this._clearHold()}
        >
            ${(() => {
              // Define all renderable elements
              const iconAlign = this._config.icon_align || 'left';
              const iconJustify = iconAlign === 'center' ? 'center' : iconAlign === 'right' ? 'flex-end' : 'flex-start';
              
              const elements = {
                icon: () => html`
                  <div class="tile-header" style="justify-content: ${iconJustify};">
                    ${(this._config.show_icon !== false) ? html`
                    <div 
                        class="icon-circle"
                        style="
                            width: ${(this._config.size_icon || 24) + 16}px; 
                            height: ${(this._config.size_icon || 24) + 16}px;
                            background: ${this._config.show_icon_circle !== false ? iconCircleBg : 'transparent'};
                            border: ${this._config.show_icon_circle !== false ? iconCircleBorder : 'none'};
                            transform: ${getTransform(this._config.icon_offset_x, this._config.icon_offset_y)};
                        "
                        @click=${(e) => { e.stopPropagation(); this._handleDelayClick(this._config.icon_tap_action || { action: "hki-more-info" }, this._config.icon_double_tap_action); }}
                        @dblclick=${(e) => { e.stopPropagation(); this._handleAction(this._config.icon_double_tap_action); }}
                        @mousedown=${(e) => { e.stopPropagation(); this._startHold(e, this._config.icon_hold_action); }}
                        @mouseup=${(e) => { e.stopPropagation(); this._clearHold(); }}
                        @mouseleave=${(e) => { this._clearHold(); }}
                        @touchstart=${(e) => { e.stopPropagation(); this._startHold(e, this._config.icon_hold_action); }}
                        @touchend=${(e) => { e.stopPropagation(); this._clearHold(); }}
                        @touchcancel=${(e) => { this._clearHold(); }}
                    >
                        ${this._config.use_entity_picture ? (() => {
                          const entityPicture = this._config.entity_picture_override || entity?.attributes?.entity_picture;
                          return entityPicture ? html`
                            <img 
                              src="${entityPicture}"
                              class="${animClass}"
                              style="width: ${this._config.size_icon || 24}px; height: ${this._config.size_icon || 24}px; border-radius: 50%; object-fit: cover;"
                            />
                          ` : html`
                            <ha-state-icon
                              .hass=${this.hass}
                              .stateObj=${entity}
                              class="${animClass}"
                              style="--mdc-icon-size: ${this._config.size_icon || 24}px; color: ${iconColor};"
                            ></ha-state-icon>
                          `;
                        })() : this._config.icon || (isOn && this._config.icon_on) ? html`
                          <ha-icon 
                            icon="${isOn && this._config.icon_on ? this._config.icon_on : this._config.icon}"
                            class="${animClass}"
                            style="--mdc-icon-size: ${this._config.size_icon || 24}px;"
                          ></ha-icon>
                        ` : html`
                          <ha-state-icon
                            .hass=${this.hass}
                            .stateObj=${entity}
                            class="${animClass}"
                            style="--mdc-icon-size: ${this._config.size_icon || 24}px; color: ${iconColor};"
                          ></ha-state-icon>
                        `}
                        ${this._renderBadge(entity, isOn, iconColor, badgeBorder, badgeBg, badgeCount, getTransform)}
                    </div>
                    ` : ''}
                  </div>
                `,
                name: () => (this._config.show_name !== false) ? html`
                  <div class="name" style="
                      ${getFont(nameFont, this._config.name_font_weight, this._config.size_name || 14)}
                      color: ${nameColor};
                      text-align: ${this._config.name_text_align || 'left'};
                      transform: ${getTransform(this._config.name_offset_x, this._config.name_offset_y)};
                  ">
                      ${nameText}
                  </div>
                ` : '',
                label: () => (this._config.show_label && labelText) ? html`
                  <div class="label" style="
                      ${getFont(labelFont, this._config.label_font_weight, this._config.size_label || 11)}
                      color: ${labelColor};
                      text-align: ${this._config.label_text_align || 'left'};
                      transform: ${getTransform(this._config.label_offset_x, this._config.label_offset_y)};
                  ">
                      ${labelText}
                  </div>
                ` : '',
                state: () => (this._config.show_state !== false) ? html`
                  <div class="state" style="
                      ${getFont(stateFont, this._config.state_font_weight, this._config.size_state || 12)}
                      color: ${stateColor};
                      text-align: ${this._config.state_text_align || 'left'};
                      transform: ${getTransform(this._config.state_offset_x, this._config.state_offset_y)};
                  ">
                      ${stateText}
                  </div>
                ` : '',
                info: () => {
                  if (this._config.show_brightness === false || !isOn) return '';
                  
                  // Use info_display_override template if provided
                  let bottomValue = this._renderedInfo || '';
                  
                  // If no override, calculate default value
                  if (!bottomValue) {
                    if (this._getDomain() === 'light') {
                      bottomValue = `${this._getBrightness()}%`;
                    } else if (this._getDomain() === 'climate') {
                      const attrs = entity.attributes || {};
                      if (attrs.target_temp_low !== undefined && attrs.target_temp_low !== null) {
                        const unit = this._getTempUnit(entity);
                        bottomValue = `${attrs.target_temp_low}-${attrs.target_temp_high}${unit}`;
                      } else if (attrs.temperature !== undefined && attrs.temperature !== null) {
                        const unit = this._getTempUnit(entity);
                        bottomValue = `${attrs.temperature}${unit}`;
                      }
                    }
                  }
                  
                  if (!bottomValue) return '';
                  const brightnessColor = isOn ? (this._config.brightness_color_on || '#000000') : (this._config.brightness_color_off || 'inherit');
                  return html`
                    <div class="brightness-tag info-tag" style="
                        ${getFont(brightnessFont, this._config.brightness_font_weight, this._config.size_brightness || 12)}
                        color: ${brightnessColor};
                        text-align: ${this._config.brightness_text_align || 'left'};
                        transform: ${getTransform(this._config.brightness_offset_x, this._config.brightness_offset_y)};
                    ">
                        ${bottomValue}
                    </div>
                  `;
                },
                spacer: () => {
                  const height = this._config.spacer_height || 16;
                  return html`<div class="grid-spacer" style="height: ${height}px;"></div>`;
                },
                temp_badge: () => {
                  // Only render for climate entities
                  if (this._getDomain() !== 'climate') return '';
                  return this._renderClimateCornerBadge(entity, isOn, iconColor, badgeBorder, badgeBg, getTransform);
                }
              };

              // Check if we have grid layout config, otherwise use default
              if (this._config.element_grid) {
                // Use grid-based layout with proper positioning
                const grid = this._config.element_grid;
                const rows = [];
                
                // Process each row (3 cells per row)
                for (let rowIdx = 0; rowIdx < 5; rowIdx++) {
                  const startIdx = rowIdx * 3;
                  const rowCells = grid.slice(startIdx, startIdx + 3);
                  
                  // Skip completely empty rows
                  if (rowCells.every(cell => cell === 'empty')) continue;
                  
                  // Build row elements with column spanning
                  const rowElements = [];
                  let colIdx = 0;
                  
                  while (colIdx < 3) {
                    const cell = rowCells[colIdx];
                    
                    if (cell === 'empty') {
                      // Empty cell - just skip, CSS grid handles it
                      colIdx++;
                      continue;
                    }
                    
                    // Count consecutive same elements for column spanning
                    let span = 1;
                    while (colIdx + span < 3 && rowCells[colIdx + span] === cell && cell !== 'spacer') {
                      span++;
                    }
                    
                    // Render element with proper grid positioning
                    const elementHtml = elements[cell]?.();
                    if (elementHtml) {
                      rowElements.push(html`
                        <div class="grid-cell" style="grid-column: ${colIdx + 1} / span ${span};">
                          ${elementHtml}
                        </div>
                      `);
                    }
                    
                    colIdx += span;
                  }
                  
                  // Only add row if it has content
                  if (rowElements.length > 0) {
                    rows.push(html`<div class="layout-grid-row">${rowElements}</div>`);
                  }
                }
                
                return html`${rows}`;
              } else {
                // Fallback to linear order for backward compatibility
                const order = (this._config.element_order || ['icon', 'name', 'label', 'state']).filter(el => el !== 'info');
                
                // Render elements in configured order with proper structure
                // Text elements need to be wrapped in tile-content-wrapper, but icon should be standalone
                const renderedElements = [];
                let textElements = [];
                
                order.forEach(el => {
                  if (el === 'icon') {
                    // If we have accumulated text elements, wrap them
                    if (textElements.length > 0) {
                      renderedElements.push(html`<div class="tile-content-wrapper">${textElements}</div>`);
                      textElements = [];
                    }
                    // Add icon directly
                    renderedElements.push(elements.icon?.());
                  } else {
                    // Accumulate text elements
                    const elementHtml = elements[el]?.();
                    if (elementHtml) {
                      textElements.push(elementHtml);
                    }
                  }
                });
                
                // Wrap any remaining text elements
                if (textElements.length > 0) {
                  renderedElements.push(html`<div class="tile-content-wrapper">${textElements}</div>`);
                }

                return html`${renderedElements}`;
              }
            })()}
        </ha-card>
      `;
    }

    static get styles() {
      return css`
        :host { display: block; }
        
        ha-card { 
            transition: all 0.3s ease; 
            overflow: hidden; 
            padding: 12px; 
            box-sizing: border-box; 
            cursor: pointer; 
            position: relative;
            display: flex; 
            flex-direction: column; 
            justify-content: space-between;
            isolation: isolate; 
            z-index: 0;
        }

        /* --- LAYOUTS --- */
        
        /* Rectangular: Default flex column behavior */
        
        /* Square: Force aspect ratio */
        .hki-tile.layout-square { 
            aspect-ratio: 1 / 1; 
            height: auto;
        }

        /* Tile: Row Layout (Icon Left, Text Right) */
        .hki-tile.layout-tile {
            flex-direction: row;
            align-items: center;
            justify-content: flex-start;
            gap: 16px;
            min-height: 72px; /* Standard HA Tile height */
        }
        .hki-tile.layout-tile .tile-header {
            width: auto;
            flex-shrink: 0;
        }
        .hki-tile.layout-tile .tile-content-wrapper {
            flex: 1;
            align-items: flex-start;
            text-align: left;
            justify-content: center;
        }
        .hki-tile.layout-tile .brightness-tag, .info-tag {
            position: static;
            transform: none;
            margin-left: auto; /* Push to right */
        }

        /* Badge: Compact Horizontal Layout (Like HA Badge) */
        .hki-tile.layout-badge {
            flex-direction: row;
            align-items: center;
            justify-content: flex-start;
            gap: 8px;
            min-height: 36px;
            height: auto;
            padding: 8px 12px;
            border-radius: 18px;
        }
        .hki-tile.layout-badge .tile-header {
            width: auto;
            flex-shrink: 0;
        }
        .hki-tile.layout-badge .icon-circle {
            width: 24px !important;
            height: 24px !important;
            padding: 0;
        }
        .hki-tile.layout-badge .icon-circle ha-icon,
        .hki-tile.layout-badge .icon-circle ha-state-icon {
            --mdc-icon-size: 16px !important;
        }
        .hki-tile.layout-badge .tile-content-wrapper {
            flex: 1;
            align-items: flex-start;
            justify-content: center;
            gap: 2px;
        }
        .hki-tile.layout-badge .name {
            font-size: 14px;
            line-height: 1.2;
        }
        .hki-tile.layout-badge .state {
            font-size: 12px;
            line-height: 1.2;
        }
        .hki-tile.layout-badge .label {
            display: none; /* Hide label in badge mode */
        }
        .hki-tile.layout-badge .brightness-tag,
        .hki-tile.layout-badge .info-tag {
            position: static;
            transform: none;
            font-size: 12px;
            margin-left: auto;
        }
        .hki-tile.layout-badge .badge,
        .hki-tile.layout-badge .climate-corner-badge {
            display: none; /* Hide badges in badge layout */
        }

        /* --- ELEMENTS --- */

        .tile-header { display: flex; justify-content: space-between; align-items: flex-start; width: 100%; z-index: 1; }
        
        .icon-circle {
            border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            position: relative;
            transition: transform 0.2s;
            cursor: pointer;
            box-sizing: border-box;
        }
        .icon-circle ha-icon { color: var(--icon-color); transition: color 0.3s; }
        .icon-circle:active { transform: scale(0.9); }

        .badge {
            position: absolute; top: -2px; right: -2px;
            color: white; border-radius: 50%;
            width: 16px; height: 16px;
            display: flex; align-items: center; justify-content: center;
            font-weight: bold;
            z-index: 2;
            box-sizing: content-box;
            pointer-events: none;
        }
        .badge.climate-corner-badge {
            top: 16px;
            right: 16px;
        }

        .brightness-tag { 
            position: absolute; 
            bottom: 12px; 
            right: 12px; 
            font-weight: 500; 
            opacity: 0.9;
            z-index: 2;
        }
        
        /* When brightness-tag is in tile-content-wrapper, use normal flow positioning */
        .tile-content-wrapper .brightness-tag,
        .tile-content-wrapper .info-tag {
            position: static;
            bottom: auto;
            right: auto;
            width: 100%;
        }
        
        /* When badge or info is in grid, remove absolute positioning */
        .grid-cell .badge,
        .grid-cell .climate-corner-badge,
        .grid-cell .brightness-tag,
        .grid-cell .info-tag {
            position: static !important;
            top: auto !important;
            right: auto !important;
            bottom: auto !important;
            left: auto !important;
            width: auto;
            margin: 0;
        }
        
        .tile-content-wrapper { display: flex; flex-direction: column; gap: 2px; z-index: 1; width: 100%; }
        
        /* Grid layout rows - 3 column grid */
        .layout-grid-row {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 12px;
            align-items: center;
            width: 100%;
        }
        
        /* Grid cell styling */
        .grid-cell {
            display: flex;
            flex-direction: column;
            justify-content: center;
        }
        
        /* Center non-text elements in grid cells */
        .grid-cell:has(.badge),
        .grid-cell:has(.climate-corner-badge),
        .grid-cell:has(.tile-header) {
            align-items: center;
        }
        
        /* Text elements in grid cells take full width */
        .grid-cell .name,
        .grid-cell .state,
        .grid-cell .label,
        .grid-cell .brightness-tag,
        .grid-cell .info-tag {
            width: 100%;
        }
        
        /* Grid spacer element - empty grid cell */
        .grid-spacer {
            min-height: 1px;
            width: 100%;
        }
        
        .name { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .state { opacity: 0.8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .label { opacity: 0.7; font-style: italic; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        /* Animations */
        @keyframes spin { 100% { transform: rotate(360deg); } }
        @keyframes pulse { 50% { opacity: 0.5; transform: scale(0.9); } }
        @keyframes bounce { 0%, 20%, 50%, 80%, 100% {transform: translateY(0);} 40% {transform: translateY(-6px);} 60% {transform: translateY(-3px);} }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); } 20%, 40%, 60%, 80% { transform: translateX(4px); } }
        @keyframes swing { 20% { transform: rotate(15deg); } 40% { transform: rotate(-10deg); } 60% { transform: rotate(5deg); } 80% { transform: rotate(-5deg); } 100% { transform: rotate(0deg); } }
        @keyframes tada { 0%, 100% { transform: scale(1) rotate(0); } 10%, 20% { transform: scale(0.9) rotate(-3deg); } 30%, 50%, 70%, 90% { transform: scale(1.1) rotate(3deg); } 40%, 60%, 80% { transform: scale(1.1) rotate(-3deg); } }
        @keyframes wobble { 0%, 100% { transform: translateX(0%); } 15% { transform: translateX(-6px) rotate(-5deg); } 30% { transform: translateX(5px) rotate(3deg); } 45% { transform: translateX(-5px) rotate(-3deg); } 60% { transform: translateX(4px) rotate(2deg); } 75% { transform: translateX(-3px) rotate(-1deg); } }
        @keyframes flip { 0% { transform: perspective(400px) rotateY(0); } 40% { transform: perspective(400px) rotateY(-180deg); } 100% { transform: perspective(400px) rotateY(-360deg); } }
        
        .animate-spin { animation: spin 2s linear infinite; }
        .animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        .animate-bounce { animation: bounce 2s infinite; }
        .animate-shake { animation: shake 0.8s cubic-bezier(0.36, 0.07, 0.19, 0.97) infinite; }
        .animate-swing { animation: swing 1s ease-in-out infinite; }
        .animate-tada { animation: tada 1.5s ease-in-out infinite; }
        .animate-wobble { animation: wobble 1s ease-in-out infinite; }
        .animate-flip { animation: flip 2s ease-in-out infinite; }
      `;
    }
  }

  /* --- ENHANCED VISUAL EDITOR WITH ACCORDIONS --- */

  class HkiButtonCardEditor extends LitElement {
    static get properties() { return { hass: {}, _config: { state: true }, _closedDetails: { state: true } }; }
    
    constructor() {
      super();
      this._closedDetails = {
        // keep the first (non-accordion) block open automatically
    
        // accordions: collapsed by default
        climate: true,
        layout_order: true,
        typography: true,
        card_styling: true,
        icon_settings: true,
    
        popup: true,
    
        actions: true,
        action_tap: true,
        action_double_tap: true,
        action_hold: true,
        action_icon_tap: true,
        action_icon_hold: true,
        action_icon_double_tap: true,
    
        offsets: true,
      };
    }


    setConfig(config) { this._config = config; }
    
    shouldUpdate(changedProps) {
      // Always update if hass changed
      if (changedProps.has('hass')) {
        return true;
      }
      
      // Always update if _closedDetails changed (accordion state)
      if (changedProps.has('_closedDetails')) {
        return true;
      }
      
      // If _config didn't change, check other properties
      if (!changedProps.has('_config')) {
        return true;
      }
      
      // If _config changed, do a deep comparison to see if it's meaningful
      const oldConfig = changedProps.get('_config');
      const newConfig = this._config;
      
      // Simple comparison - if they're the same reference, no update needed
      if (oldConfig === newConfig) {
        return false;
      }
      
      // Deep comparison - stringify and compare
      // This prevents re-renders from object reference changes when content is identical
      try {
        return JSON.stringify(oldConfig) !== JSON.stringify(newConfig);
      } catch (e) {
        // If stringify fails, assume we need to update
        return true;
      }
    }
    
    render() {
      if (!this.hass || !this._config) return html``;
      
      const fonts = ["system", "Roboto", "Open Sans", "Lato", "Montserrat", "Oswald", "Raleway", "custom"];
      // Weights as Names
      const weights = ["lighter", "normal", "bold", "bolder"];
      const shapes = ["rectangular", "square", "tile", "badge"];
      const borders = ["solid", "dashed", "dotted", "double", "none"];

      const selectedEntity = this.hass.states[this._config.entity];
      const isClimate = selectedEntity && selectedEntity.entity_id && selectedEntity.entity_id.split('.')[0] === 'climate';

      // Custom Actions Dropdown List (Replaces Native Selector)
      const actionsList = [
        { value: "toggle", label: "Toggle" },
        { value: "hki-more-info", label: "More Info (HKI)" },
        { value: "more-info", label: "More Info (Native)" },
        { value: "navigate", label: "Navigate" },
        { value: "perform-action", label: "Perform Action" },
        { value: "url", label: "URL" },
        { value: "none", label: "None" }
      ];

      const renderHeader = (title, key) => html`
        <div class="accordion-header" @click=${(e) => this._toggleHeader(e, key)}>
           <span>${title}</span>
           <ha-icon icon="${this._closedDetails[key] ? 'mdi:plus' : 'mdi:minus'}"></ha-icon>
        </div>
      `;

      // Helper to generate Font Inputs for a specific element (Name, State, Label)
      const renderFontSection = (prefix, label) => html`
        <div class="sub-section">
            <strong>${label} Typography</strong>
            <div class="side-by-side">
                <ha-select 
                  label="Family" 
                  .value=${this._config[`${prefix}_font_family`] || "system"} 
                  @selected=${(ev) => this._dropdownChanged(ev, `${prefix}_font_family`)} 
                  @closed=${(e) => e.stopPropagation()}
                  @click=${(e) => e.stopPropagation()}
                >
                    ${fonts.map(f => html`<mwc-list-item .value=${f}>${f}</mwc-list-item>`)}
                </ha-select>
                <ha-select 
                  label="Weight" 
                  .value=${this._config[`${prefix}_font_weight`] || "normal"} 
                  @selected=${(ev) => this._dropdownChanged(ev, `${prefix}_font_weight`)} 
                  @closed=${(e) => e.stopPropagation()}
                  @click=${(e) => e.stopPropagation()}
                >
                    ${weights.map(w => html`<mwc-list-item .value=${w}>${w.charAt(0).toUpperCase() + w.slice(1)}</mwc-list-item>`)}
                </ha-select>
            </div>
            ${this._config[`${prefix}_font_family`] === 'custom' ? html`
                <ha-textfield .label=${"Custom Font Name"} .value=${this._config[`${prefix}_font_custom`] || ""} @input=${(ev) => this._textChanged(ev, `${prefix}_font_custom`)}></ha-textfield>
            ` : ''}
            <div class="side-by-side">
                <ha-textfield label="Size (px)" type="number" .value=${this._config[`size_${prefix}`] || ""} @input=${(ev) => this._textChanged(ev, `size_${prefix}`)}></ha-textfield>
                <ha-select 
                  label="Alignment" 
                  .value=${this._config[`${prefix}_text_align`] || "left"} 
                  @selected=${(ev) => this._dropdownChanged(ev, `${prefix}_text_align`)} 
                  @closed=${(e) => e.stopPropagation()}
                  @click=${(e) => e.stopPropagation()}
                >
                    <mwc-list-item value="left">Left</mwc-list-item>
                    <mwc-list-item value="center">Center</mwc-list-item>
                    <mwc-list-item value="right">Right</mwc-list-item>
                </ha-select>
            </div>
            <div class="side-by-side">
                <ha-textfield label="Color (Off)" .value=${this._config[`${prefix}_color_off`] || ""} @input=${(ev) => this._textChanged(ev, `${prefix}_color_off`)}></ha-textfield>
                <ha-textfield label="Color (On)" .value=${this._config[`${prefix}_color_on`] || ""} @input=${(ev) => this._textChanged(ev, `${prefix}_color_on`)}></ha-textfield>
            </div>
        </div>
      `;
      
      // Helper for Action Dropdowns with conditional fields
      const renderActionDropdown = (label, configKey) => {
          const currentAction = (this._config[configKey] && this._config[configKey].action) ? this._config[configKey].action : "none";
          const actionConfig = this._config[configKey] || {};
          
          return html`
            <div class="action-config-section">
              <strong>${label}</strong>
              <ha-select 
                label="Action Type" 
                .value=${currentAction} 
                @selected=${(ev) => this._actionChanged(ev, configKey)} 
                @closed=${(e) => e.stopPropagation()} 
                @click=${(e) => e.stopPropagation()}
              >
                  ${actionsList.map(a => html`<mwc-list-item .value=${a.value}>${a.label}</mwc-list-item>`)}
              </ha-select>
              
              ${currentAction === 'navigate' ? html`
                <ha-textfield 
                  label="Navigation Path" 
                  .value=${actionConfig.navigation_path || ""} 
                  @input=${(ev) => this._actionFieldChanged(ev, configKey, 'navigation_path')}
                  placeholder="/lovelace/0"
                ></ha-textfield>
              ` : ''}
              
              ${currentAction === 'url' ? html`
                <ha-textfield 
                  label="URL Path" 
                  .value=${actionConfig.url_path || ""} 
                  @input=${(ev) => this._actionFieldChanged(ev, configKey, 'url_path')}
                  placeholder="https://example.com"
                ></ha-textfield>
              ` : ''}
              
              ${currentAction === "perform-action" ? html`
                <div class="perform-action-config">
                  <ha-textfield
                    .hass=${this.hass}
                    label="Service (e.g., light.turn_on)"
                    .value=${actionConfig.perform_action || ""}
                    @input=${(ev) => {
                      ev.stopPropagation();
                      const service = ev.target.value;
                      if (service !== actionConfig.perform_action) {
                        const updated = { 
                          action: "perform-action",
                          perform_action: service 
                        };
                        // Preserve existing target and data if they exist
                        if (actionConfig.target) updated.target = actionConfig.target;
                        if (actionConfig.data) updated.data = actionConfig.data;
                        this._fireChanged({ ...this._config, [configKey]: updated });
                      }
                    }}
                    placeholder="light.turn_on"
                  ></ha-textfield>

                  ${actionConfig.perform_action ? html`
                    <ha-selector
                      .hass=${this.hass}
                      .selector=${{ target: {} }}
                      .label=${"Target (optional)"}
                      .value=${actionConfig.target || null}
                      @value-changed=${(ev) => {
                        ev.stopPropagation();
                        const target = ev.detail?.value;
                        // Only update if target actually changed
                        const currentTarget = actionConfig.target;
                        if (JSON.stringify(currentTarget) !== JSON.stringify(target)) {
                          const updated = { ...actionConfig };
                          if (target && Object.keys(target).length > 0) {
                            updated.target = target;
                          } else {
                            delete updated.target;
                          }
                          this._fireChanged({ ...this._config, [configKey]: updated });
                        }
                      }}
                      @click=${(e) => e.stopPropagation()}
                    ></ha-selector>

                    <ha-yaml-editor
                      .hass=${this.hass}
                      .label=${"Service Data (optional, YAML)"}
                      .value=${actionConfig.data || null}
                      @value-changed=${(ev) => {
                        ev.stopPropagation();
                        const data = ev.detail?.value;
                        // Only update if data actually changed
                        const currentData = actionConfig.data;
                        if (JSON.stringify(currentData) !== JSON.stringify(data)) {
                          const updated = { ...actionConfig };
                          if (data && typeof data === 'object' && Object.keys(data).length > 0) {
                            updated.data = data;
                          } else {
                            delete updated.data;
                          }
                          this._fireChanged({ ...this._config, [configKey]: updated });
                        }
                      }}
                      @click=${(e) => e.stopPropagation()}
                    ></ha-yaml-editor>
                  ` : ''}
                </div>
              ` : ""}
              
              ${currentAction === 'more-info' ? html`
                <ha-selector 
                  .hass=${this.hass} 
                  .selector=${{ entity: {} }} 
                  .value=${actionConfig.entity || ""} 
                  .label=${"Entity (optional)"} 
                  @value-changed=${(ev) => this._actionFieldSelectorChanged(ev, configKey, 'entity')}
                ></ha-selector>
              ` : ''}
            </div>
          `;
      };

      return html`
        <div class="card-config">
          
          <div class="accordion-group">
            ${renderHeader("Entity", "general")}
            <div class="accordion-content ${this._closedDetails['general'] ? 'hidden' : ''}">
                <ha-selector .hass=${this.hass} .selector=${{ entity: {} }} .value=${this._config.entity || ""} .label=${"Entity"} @value-changed=${(ev) => this._selectorChanged(ev, "entity")}></ha-selector>
                
                <div class="separator"></div>
                <strong>Appearance</strong>
                <ha-formfield .label=${"Use Entity Picture"}><ha-switch .checked=${this._config.use_entity_picture === true} @change=${(ev) => this._switchChanged(ev, "use_entity_picture")}></ha-switch></ha-formfield>
                
                ${this._config.use_entity_picture ? html`
                  <ha-textfield .label=${"Entity Picture Override (optional)"} .value=${this._config.entity_picture_override || ""} @input=${(ev) => this._textChanged(ev, "entity_picture_override")}></ha-textfield>
                ` : html`
                  <div class="side-by-side" style="align-items:center;">
                    <ha-selector 
                      .hass=${this.hass} 
                      .selector=${{ icon: {} }} 
                      .value=${this._config.icon || ""} 
                      .label=${"Icon"} 
                      @value-changed=${(ev) => this._selectorChanged(ev, "icon")}
                    ></ha-selector>
                    <button class="hki-editor-clear" title="Clear Icon" @click=${(e) => { e.stopPropagation(); this._fireChanged({ ...this._config, icon: "" }); }}>
                      <ha-icon icon="mdi:close"></ha-icon>
                    </button>
                  </div>
                `}
                
                <ha-select 
                  label="Card Layout" 
                  .value=${this._config.card_layout || "rectangular"} 
                  @selected=${(ev) => this._dropdownChanged(ev, "card_layout")} 
                  @closed=${(e) => e.stopPropagation()}
                  @click=${(e) => e.stopPropagation()}
                >
                    ${shapes.map(a => html`<mwc-list-item .value=${a}>${a.charAt(0).toUpperCase() + a.slice(1)}</mwc-list-item>`)}
                </ha-select>
                
                <div class="separator"></div>
                <strong>Text Overrides (Jinja)</strong>
                <p style="font-size: 11px; opacity: 0.7; margin-top: 0;">
                  These fields support Jinja templates (e.g., <code>{{ states('sensor.temperature') }}°C</code>).
                  Available variables: <code>config</code>, <code>user</code>.
                </p>

                <div class="tpl-field">
                  <div class="tpl-title">Name (top line)</div>
                  <div class="tpl-desc">Overrides the primary name text shown on the tile.</div>
                  <ha-code-editor
                    .hass=${this.hass}
                    mode="yaml"
                    autocomplete-entities
                    .autocompleteEntities=${true}
                    .label=${"Name template"}
                    .value=${this._config.name || ""}
                    @value-changed=${(ev) => {
                      ev.stopPropagation();
                      const value = ev.detail?.value;
                      if (value !== this._config.name) {
                        this._fireChanged({ ...this._config, name: value || undefined });
                      }
                    }}
                    @click=${(e) => e.stopPropagation()}
                  ></ha-code-editor>
                </div>

                <div class="tpl-field">
                  <div class="tpl-title">State (bottom-right / state line)</div>
                  <div class="tpl-desc">Overrides the state text (normally the entity state, like On/Off/23°C).</div>
                  <ha-code-editor
                    .hass=${this.hass}
                    mode="yaml"
                    autocomplete-entities
                    .autocompleteEntities=${true}
                    .label=${"State template"}
                    .value=${this._config.state_label || ""}
                    @value-changed=${(ev) => {
                      ev.stopPropagation();
                      const value = ev.detail?.value;
                      if (value !== this._config.state_label) {
                        this._fireChanged({ ...this._config, state_label: value || undefined });
                      }
                    }}
                    @click=${(e) => e.stopPropagation()}
                  ></ha-code-editor>
                </div>

                <div class="tpl-field">
                  <div class="tpl-title">Label (subtitle)</div>
                  <div class="tpl-desc">Overrides the smaller subtitle/label text (if enabled).</div>
                  <ha-code-editor
                    .hass=${this.hass}
                    mode="yaml"
                    autocomplete-entities
                    .autocompleteEntities=${true}
                    .label=${"Label template"}
                    .value=${this._config.label || ""}
                    @value-changed=${(ev) => {
                      ev.stopPropagation();
                      const value = ev.detail?.value;
                      if (value !== this._config.label) {
                        this._fireChanged({ ...this._config, label: value || undefined });
                      }
                    }}
                    @click=${(e) => e.stopPropagation()}
                  ></ha-code-editor>
                </div>

                <div class="tpl-field">
                  <div class="tpl-title">Info (the optional “info” row)</div>
                  <div class="tpl-desc">Overrides the info line when the card layout includes an info element.</div>
                  <ha-code-editor
                    .hass=${this.hass}
                    mode="yaml"
                    autocomplete-entities
                    .autocompleteEntities=${true}
                    .label=${"Info template"}
                    .value=${this._config.info_display_override || ""}
                    @value-changed=${(ev) => {
                      ev.stopPropagation();
                      const value = ev.detail?.value;
                      if (value !== this._config.info_display_override) {
                        this._fireChanged({ ...this._config, info_display_override: value || undefined });
                      }
                    }}
                    @click=${(e) => e.stopPropagation()}
                  ></ha-code-editor>
                </div>
            </div>
          </div>

          ${isClimate ? html`
          <div class="accordion-group">
            ${renderHeader("Climate Settings", "climate")}
            <div class="accordion-content ${this._closedDetails['climate'] ? 'hidden' : ''}">
                <div class="side-by-side" style="align-items:center;">
                  <ha-selector 
                    .hass=${this.hass} 
                    .selector=${{ entity: {} }} 
                    .value=${this._config.climate_current_temperature_entity || ""} 
                    .label=${"Current Temp Entity (optional)"} 
                    @value-changed=${(ev) => this._selectorChanged(ev, "climate_current_temperature_entity")}
                  ></ha-selector>
                  <button class="hki-editor-clear" title="Clear" @click=${(e) => { e.stopPropagation(); this._fireChanged({ ...this._config, climate_current_temperature_entity: "" }); }}>
                    <ha-icon icon="mdi:close"></ha-icon>
                  </button>
                </div>

                <ha-textfield label="Temp Friendly Name (optional)" .value=${this._config.climate_temperature_name || ""} @input=${(ev) => this._textChanged(ev, "climate_temperature_name")}></ha-textfield>

                <div class="side-by-side" style="align-items:center;">
                  <ha-selector 
                    .hass=${this.hass} 
                    .selector=${{ entity: {} }} 
                    .value=${this._config.climate_humidity_entity || ""} 
                    .label=${"Humidity Entity (optional)"} 
                    @value-changed=${(ev) => this._selectorChanged(ev, "climate_humidity_entity")}
                  ></ha-selector>
                  <button class="hki-editor-clear" title="Clear" @click=${(e) => { e.stopPropagation(); this._fireChanged({ ...this._config, climate_humidity_entity: "" }); }}>
                    <ha-icon icon="mdi:close"></ha-icon>
                  </button>
                </div>

                <ha-textfield label="Humidity Friendly Name (optional)" .value=${this._config.climate_humidity_name || ""} @input=${(ev) => this._textChanged(ev, "climate_humidity_name")}></ha-textfield>

                <div class="side-by-side" style="align-items:center;">
                  <ha-selector 
                    .hass=${this.hass} 
                    .selector=${{ entity: {} }} 
                    .value=${this._config.climate_pressure_entity || ""} 
                    .label=${"Pressure Entity (optional)"} 
                    @value-changed=${(ev) => this._selectorChanged(ev, "climate_pressure_entity")}
                  ></ha-selector>
                  <button class="hki-editor-clear" title="Clear" @click=${(e) => { e.stopPropagation(); this._fireChanged({ ...this._config, climate_pressure_entity: "" }); }}>
                    <ha-icon icon="mdi:close"></ha-icon>
                  </button>
                </div>

                <ha-textfield label="Pressure Friendly Name (optional)" .value=${this._config.climate_pressure_name || ""} @input=${(ev) => this._textChanged(ev, "climate_pressure_name")}></ha-textfield>
                
                <div class="separator"></div>
                <strong>Popup Slider Settings</strong>
                <ha-textfield label="Temperature Step Size" type="number" step="0.1" .value=${this._config.climate_temp_step ?? 0.5} @input=${(ev) => this._textChanged(ev, "climate_temp_step")} placeholder="0.5"></ha-textfield>
                <ha-formfield .label=${"Use Circular Slider"}><ha-switch .checked=${this._config.climate_use_circular_slider === true} @change=${(ev) => this._switchChanged(ev, "climate_use_circular_slider")}></ha-switch></ha-formfield>
                <ha-formfield .label=${"Show +/- Buttons"}><ha-switch .checked=${this._config.climate_show_plus_minus === true} @change=${(ev) => this._switchChanged(ev, "climate_show_plus_minus")}></ha-switch></ha-formfield>
                <ha-formfield .label=${"Show Gradient"}><ha-switch .checked=${this._config.climate_show_gradient !== false} @change=${(ev) => this._switchChanged(ev, "climate_show_gradient")}></ha-switch></ha-formfield>
                
                <div class="separator"></div>
                <strong>Temperature Badge Styling</strong>
                <div class="side-by-side">
                  <ha-textfield label="Size (px)" type="number" .value=${this._config.temp_badge_size ?? 33} @input=${(ev) => this._textChanged(ev, "temp_badge_size")}></ha-textfield>
                  <ha-textfield label="Font Size (px)" type="number" .value=${this._config.size_temp_badge ?? 9} @input=${(ev) => this._textChanged(ev, "size_temp_badge")}></ha-textfield>
                </div>
                <div class="side-by-side">
                  <ha-select 
                    label="Font Family" 
                    .value=${this._config.temp_badge_font_family || "system"} 
                    @selected=${(ev) => this._dropdownChanged(ev, "temp_badge_font_family")}
                    @closed=${(e) => e.stopPropagation()}
                    @click=${(e) => e.stopPropagation()}
                  >
                    ${fonts.map(f => html`<mwc-list-item .value=${f}>${f}</mwc-list-item>`)}
                  </ha-select>
                  <ha-select 
                    label="Font Weight" 
                    .value=${this._config.temp_badge_font_weight || "normal"} 
                    @selected=${(ev) => this._dropdownChanged(ev, "temp_badge_font_weight")}
                    @closed=${(e) => e.stopPropagation()}
                    @click=${(e) => e.stopPropagation()}
                  >
                    ${weights.map(w => html`<mwc-list-item .value=${w}>${w.charAt(0).toUpperCase() + w.slice(1)}</mwc-list-item>`)}
                  </ha-select>
                </div>
                ${this._config.temp_badge_font_family === 'custom' ? html`
                  <ha-textfield label="Custom Font Name" .value=${this._config.temp_badge_font_custom || ""} @input=${(ev) => this._textChanged(ev, "temp_badge_font_custom")}></ha-textfield>
                ` : ''}
                <div class="side-by-side">
                  <ha-textfield label="Border Radius" .value=${this._config.temp_badge_border_radius ?? ""} @input=${(ev) => this._textChanged(ev, "temp_badge_border_radius")}></ha-textfield>
                  <ha-textfield label="Box Shadow" .value=${this._config.temp_badge_box_shadow || ""} @input=${(ev) => this._textChanged(ev, "temp_badge_box_shadow")}></ha-textfield>
                </div>
                <div class="side-by-side">
                  <ha-textfield label="Text Color" .value=${this._config.temp_badge_text_color || ""} @input=${(ev) => this._textChanged(ev, "temp_badge_text_color")}></ha-textfield>
                  <ha-textfield label="Border Color" .value=${this._config.temp_badge_border_color || ""} @input=${(ev) => this._textChanged(ev, "temp_badge_border_color")}></ha-textfield>
                </div>
                <div class="side-by-side">
                  <ha-select 
                    label="Border Style" 
                    .value=${this._config.temp_badge_border_style || "none"} 
                    @selected=${(ev) => this._dropdownChanged(ev, "temp_badge_border_style")}
                    @closed=${(e) => e.stopPropagation()}
                    @click=${(e) => e.stopPropagation()}
                  >
                    ${borders.map(b => html`<mwc-list-item .value=${b}>${b}</mwc-list-item>`)}
                  </ha-select>
                  <ha-textfield label="Border Width" .value=${this._config.temp_badge_border_width || ""} @input=${(ev) => this._textChanged(ev, "temp_badge_border_width")}></ha-textfield>
                </div>
            </div>
          </div>
          ` : ''}

          <div class="accordion-group">
            ${renderHeader("Layout & Visibility", "layout_order")}
            <div class="accordion-content ${this._closedDetails['layout_order'] ? 'hidden' : ''}">
                <strong>Arrange Elements in 5x3 Grid</strong>
                <p style="font-size: 13px; opacity: 0.7; margin: 8px 0;">
                  Click an element, then click a grid cell to place it. Elements in the same row appear side-by-side. Right-click a cell to clear it.<br><br>
                  <strong>Text Alignment:</strong> Text elements (name, state, label, info) will use the alignment you set in Typography (left/center/right), but only if the text fits within its grid cell. For text that's too long, place the same element in multiple consecutive columns (e.g., place "name" in all 3 columns of row 3) to span the full width.
                </p>
                ${(() => {
                  // Default 5x3 grid: icon, spacer, name, label, state/info in left column
                  const defaultGrid = [
                    'icon', 'empty', 'empty',
                    'empty', 'empty', 'empty',
                    'name', 'empty', 'empty',
                    'label', 'empty', 'empty',
                    'state', 'info', 'empty'
                  ];
                  const currentGrid = this._config.element_grid || defaultGrid;
                  
                  // Track selected element for placement
                  const selectedElement = this._selectedGridElement || null;
                  
                  const elementLabels = {
                    icon: 'Icon',
                    name: 'Name',
                    label: 'Label',
                    state: 'State',
                    info: 'Info',
                    spacer: 'Spacer',
                    temp_badge: 'Temp Badge'
                  };
                  
                  const elementIcons = {
                    icon: 'mdi:image-outline',
                    name: 'mdi:format-title',
                    label: 'mdi:label-outline',
                    state: 'mdi:information-outline',
                    info: 'mdi:chart-line',
                    spacer: 'mdi:minus',
                    temp_badge: 'mdi:thermometer'
                  };
                  
                  // Determine available elements based on entity type
                  const availableElements = ['icon', 'name', 'state', 'label', 'info', 'spacer'];
                  if (isClimate) {
                    availableElements.push('temp_badge');
                  }
                  
                  // Count how many times each element appears
                  const elementCounts = currentGrid.reduce((acc, el) => {
                    if (el !== 'empty') acc[el] = (acc[el] || 0) + 1;
                    return acc;
                  }, {});
                  
                  return html`
                    <div class="grid-layout-editor">
                      <!-- Element palette -->
                      <div class="element-palette">
                        ${availableElements.map(el => html`
                          <button 
                            class="palette-element ${selectedElement === el ? 'selected' : ''}"
                            @click=${(e) => {
                              e.stopPropagation();
                              this._selectedGridElement = this._selectedGridElement === el ? null : el;
                              this.requestUpdate();
                            }}
                            title="${elementLabels[el]}"
                          >
                            <ha-icon icon="${elementIcons[el]}"></ha-icon>
                            <span>${elementLabels[el]}</span>
                            ${elementCounts[el] ? html`<span class="element-count">${elementCounts[el]}</span>` : ''}
                          </button>
                        `)}
                      </div>
                      
                      <!-- 5x3 Grid (5 rows, 3 columns) -->
                      <div class="layout-grid">
                        ${currentGrid.map((cell, idx) => html`
                          <div 
                            class="grid-cell ${cell !== 'empty' ? 'filled' : ''} ${selectedElement ? 'selectable' : ''}"
                            @click=${(e) => {
                              e.stopPropagation();
                              if (selectedElement) {
                                const newGrid = [...currentGrid];
                                newGrid[idx] = selectedElement;
                                this._fireChanged({ ...this._config, element_grid: newGrid });
                                this._selectedGridElement = null;
                                this.requestUpdate();
                              }
                            }}
                            @contextmenu=${(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              // Right-click to clear cell
                              const newGrid = [...currentGrid];
                              newGrid[idx] = 'empty';
                              this._fireChanged({ ...this._config, element_grid: newGrid });
                            }}
                            title="${cell !== 'empty' ? elementLabels[cell] : 'Empty (right-click to clear)'}"
                          >
                            ${cell !== 'empty' ? html`
                              <ha-icon icon="${elementIcons[cell]}"></ha-icon>
                              <span>${elementLabels[cell]}</span>
                            ` : html`<span class="empty-indicator">+</span>`}
                          </div>
                        `)}
                      </div>
                      
                      <div style="display: flex; gap: 8px; margin-top: 12px;">
                        <button 
                          class="reset-order-btn"
                          style="flex: 1;"
                          @click=${(e) => {
                            e.stopPropagation();
                            this._fireChanged({ ...this._config, element_grid: defaultGrid });
                            this._selectedGridElement = null;
                            this.requestUpdate();
                          }}
                        >
                          Reset to Default
                        </button>
                        <button 
                          class="reset-order-btn"
                          style="flex: 1;"
                          @click=${(e) => {
                            e.stopPropagation();
                            this._fireChanged({ ...this._config, element_grid: Array(15).fill('empty') });
                            this._selectedGridElement = null;
                            this.requestUpdate();
                          }}
                        >
                          Clear All
                        </button>
                      </div>
                      
                      <div class="separator"></div>
                      <strong>Spacer Settings</strong>
                      <ha-textfield 
                        label="Spacer Height (px)" 
                        type="number" 
                        .value=${this._config.spacer_height || 16} 
                        @input=${(ev) => this._textChanged(ev, "spacer_height")}
                        placeholder="16"
                      ></ha-textfield>
                    </div>
                  `;
                })()}
            </div>
          </div>

          <div class="accordion-group">
             ${renderHeader("Card Styling", "card_styling")}
             <div class="accordion-content ${this._closedDetails['card_styling'] ? 'hidden' : ''}">
                <strong>Colors</strong>
                <div class="side-by-side">
                    <ha-textfield label="Card Bg (Off)" .value=${this._config.card_color_off || ""} @input=${(ev) => this._textChanged(ev, "card_color_off")}></ha-textfield>
                    <ha-textfield label="Card Bg (On)" .value=${this._config.card_color_on || ""} @input=${(ev) => this._textChanged(ev, "card_color_on")}></ha-textfield>
                </div>
                <div class="side-by-side">
                    <ha-textfield label="Card Opacity (Off)" type="number" step="0.1" min="0" max="1" .value=${this._config.card_opacity_off ?? ""} @input=${(ev) => this._textChanged(ev, "card_opacity_off")} placeholder="1"></ha-textfield>
                    <ha-textfield label="Card Opacity (On)" type="number" step="0.1" min="0" max="1" .value=${this._config.card_opacity_on ?? ""} @input=${(ev) => this._textChanged(ev, "card_opacity_on")} placeholder="1"></ha-textfield>
                </div>

                <div class="separator"></div>
                <strong>Card Border</strong>
                <div class="side-by-side">
                    <ha-select 
                      label="Style" 
                      .value=${this._config.border_style || "none"} 
                      @selected=${(ev) => this._dropdownChanged(ev, "border_style")} 
                      @closed=${(e) => e.stopPropagation()}
                      @click=${(e) => e.stopPropagation()}
                    >
                        ${borders.map(b => html`<mwc-list-item .value=${b}>${b}</mwc-list-item>`)}
                    </ha-select>
                    <ha-textfield label="Width (auto adds px)" .value=${this._config.border_width || ""} @input=${(ev) => this._textChanged(ev, "border_width")}></ha-textfield>
                </div>
                <div class="side-by-side">
                    <ha-textfield label="Color" .value=${this._config.border_color || ""} @input=${(ev) => this._textChanged(ev, "border_color")}></ha-textfield>
                    <ha-textfield label="Radius" type="number" .value=${this._config.border_radius ?? 12} @input=${(ev) => this._textChanged(ev, "border_radius")}></ha-textfield>
                </div>
                <ha-textfield label="Box Shadow" .value=${this._config.box_shadow || ""} @input=${(ev) => this._textChanged(ev, "box_shadow")}></ha-textfield>
             </div>
          </div>

          <div class="accordion-group">
             ${renderHeader("Icon Styling", "icon_settings")}
             <div class="accordion-content ${this._closedDetails['icon_settings'] ? 'hidden' : ''}">
                <strong>Icon Override</strong>
                <div class="side-by-side" style="align-items:center;">
                  <ha-selector 
                    .hass=${this.hass} 
                    .selector=${{ icon: {} }} 
                    .value=${this._config.icon_on || ""} 
                    .label=${"Icon (On State)"} 
                    @value-changed=${(ev) => this._selectorChanged(ev, "icon_on")}
                  ></ha-selector>
                  <button class="hki-editor-clear" title="Clear Icon" @click=${(e) => { e.stopPropagation(); this._fireChanged({ ...this._config, icon_on: "" }); }}>
                    <ha-icon icon="mdi:close"></ha-icon>
                  </button>
                </div>

                <div class="separator"></div>
                <strong>Icon Styling</strong>
                <div class="side-by-side">
                    <ha-textfield label="Size (px)" type="number" .value=${this._config.size_icon || 24} @input=${(ev) => this._textChanged(ev, "size_icon")}></ha-textfield>
                    <ha-select 
                      label="Alignment" 
                      .value=${this._config.icon_align || "left"} 
                      @selected=${(ev) => this._dropdownChanged(ev, "icon_align")} 
                      @closed=${(e) => e.stopPropagation()}
                      @click=${(e) => e.stopPropagation()}
                    >
                        <mwc-list-item value="left">Left</mwc-list-item>
                        <mwc-list-item value="center">Center</mwc-list-item>
                        <mwc-list-item value="right">Right</mwc-list-item>
                    </ha-select>
                </div>
                <div class="side-by-side">
                    <ha-textfield label="Color (Off)" .value=${this._config.icon_color_off || ""} @input=${(ev) => this._textChanged(ev, "icon_color_off")}></ha-textfield>
                    <ha-textfield label="Color (On)" .value=${this._config.icon_color_on || "auto"} @input=${(ev) => this._textChanged(ev, "icon_color_on")}></ha-textfield>
                </div>

                <div class="separator"></div>
                <strong>Icon Circle</strong>
                <div class="side-by-side">
                    <ha-textfield label="Bg (Off)" .value=${this._config.icon_circle_bg_off || ""} @input=${(ev) => this._textChanged(ev, "icon_circle_bg_off")}></ha-textfield>
                    <ha-textfield label="Bg (On)" .value=${this._config.icon_circle_bg_on || ""} @input=${(ev) => this._textChanged(ev, "icon_circle_bg_on")}></ha-textfield>
                </div>
                <div class="side-by-side">
                     <ha-select 
                        label="Border Style" 
                        .value=${this._config.icon_circle_border_style || "none"} 
                        @selected=${(ev) => this._dropdownChanged(ev, "icon_circle_border_style")}
                        @closed=${(e) => e.stopPropagation()}
                        @click=${(e) => e.stopPropagation()}
                     >
                        ${borders.map(b => html`<mwc-list-item .value=${b}>${b}</mwc-list-item>`)}
                    </ha-select>
                    <ha-textfield label="Width (auto adds px)" .value=${this._config.icon_circle_border_width || ""} @input=${(ev) => this._textChanged(ev, "icon_circle_border_width")}></ha-textfield>
                </div>
                 <ha-textfield label="Border Color" .value=${this._config.icon_circle_border_color || ""} @input=${(ev) => this._textChanged(ev, "icon_circle_border_color")}></ha-textfield>

                <div class="separator"></div>
                <strong>Icon Badge</strong>
                <div class="side-by-side">
                    <ha-textfield label="Bg (Off)" .value=${this._config.badge_bg_off || ""} @input=${(ev) => this._textChanged(ev, "badge_bg_off")}></ha-textfield>
                    <ha-textfield label="Bg (On)" .value=${this._config.badge_bg_on || ""} @input=${(ev) => this._textChanged(ev, "badge_bg_on")}></ha-textfield>
                </div>
                <div class="side-by-side">
                    <ha-textfield label="Border Color" .value=${this._config.badge_border_color || ""} @input=${(ev) => this._textChanged(ev, "badge_border_color")}></ha-textfield>
                    <ha-select 
                      label="Border Style" 
                      .value=${this._config.badge_border_style || "none"} 
                      @selected=${(ev) => this._dropdownChanged(ev, "badge_border_style")}
                      @closed=${(e) => e.stopPropagation()}
                      @click=${(e) => e.stopPropagation()}
                    >
                        ${borders.map(b => html`<mwc-list-item .value=${b}>${b}</mwc-list-item>`)}
                    </ha-select>
                </div>
                <ha-textfield label="Border Width (auto adds px)" .value=${this._config.badge_border_width || ""} @input=${(ev) => this._textChanged(ev, "badge_border_width")}></ha-textfield>
                
                <div class="separator"></div>
                <strong>Icon Animation</strong>
                <ha-select 
                  label="Animation (On)" 
                  .value=${this._config.icon_animation || "none"} 
                  @selected=${(ev) => this._dropdownChanged(ev, "icon_animation")} 
                  @closed=${(e) => e.stopPropagation()}
                  @click=${(e) => e.stopPropagation()}
                >
                    <mwc-list-item value="none">None</mwc-list-item>
                    <mwc-list-item value="spin">Spin</mwc-list-item>
                    <mwc-list-item value="pulse">Pulse</mwc-list-item>
                    <mwc-list-item value="bounce">Bounce</mwc-list-item>
                    <mwc-list-item value="shake">Shake</mwc-list-item>
                    <mwc-list-item value="swing">Swing</mwc-list-item>
                    <mwc-list-item value="tada">Tada</mwc-list-item>
                    <mwc-list-item value="wobble">Wobble</mwc-list-item>
                    <mwc-list-item value="flip">Flip</mwc-list-item>
                </ha-select>
             </div>
          </div>

          <div class="accordion-group">
            ${renderHeader("Typography", "typography")}
             <div class="accordion-content ${this._closedDetails['typography'] ? 'hidden' : ''}">
                ${renderFontSection("name", "Name")}
                <div class="separator"></div>
                ${renderFontSection("state", "State")}
                <div class="separator"></div>
                ${renderFontSection("label", "Label")}
                <div class="separator"></div>
                ${renderFontSection("brightness", "Info Display")}
             </div>
          </div>

          <div class="accordion-group">
            ${renderHeader("HKI Popup Options", "popup")}
             <div class="accordion-content ${this._closedDetails['popup'] ? 'hidden' : ''}">
                <p style="font-size: 12px; opacity: 0.7; margin: 8px 0; padding: 8px; background: var(--secondary-background-color); border-radius: 6px; border-left: 3px solid var(--primary-color);">
                  <strong>Note:</strong> These settings only work when an action is set to <code>more-info (HKI)</code>.
                </p>
                
                ${(() => {
                  const domain = selectedEntity?.entity_id?.split('.')[0];
                  
                  // Show/hide options based on entity domain
                  const showLightOptions = domain === 'light';
                  const showClimateOptions = isClimate;
                  const showAlarmOptions = domain === 'alarm_control_panel';
                  const showCoverOptions = domain === 'cover';
                  
                  if (!showLightOptions && !showClimateOptions && !showAlarmOptions && !showCoverOptions) {
                    return html`<p style="font-size: 12px; opacity: 0.7; margin: 8px 0;">Select an entity to see popup options.</p>`;
                  }
                  
                  return html`
                    <div class="separator"></div>
                    <strong>Popup Features</strong>
                    <div class="checkbox-grid">
                      ${showLightOptions ? html`
                        <ha-formfield .label=${"Show Favorites"}><ha-switch .checked=${this._config.popup_show_favorites !== false} @change=${(ev) => this._switchChanged(ev, "popup_show_favorites")}></ha-switch></ha-formfield>
                        <ha-formfield .label=${"Show Effects"}><ha-switch .checked=${this._config.popup_show_effects !== false} @change=${(ev) => this._switchChanged(ev, "popup_show_effects")}></ha-switch></ha-formfield>
                      ` : ''}
                      ${showClimateOptions ? html`
                        <ha-formfield .label=${"Show Presets"}><ha-switch .checked=${this._config.popup_show_presets !== false} @change=${(ev) => this._switchChanged(ev, "popup_show_presets")}></ha-switch></ha-formfield>
                      ` : ''}
                      ${showCoverOptions ? html`
                        <ha-formfield .label=${"Show Favorites"}><ha-switch .checked=${this._config.popup_show_favorites !== false} @change=${(ev) => this._switchChanged(ev, "popup_show_favorites")}></ha-switch></ha-formfield>
                      ` : ''}
                    </div>
                  `;
                })()}
                
                <div class="separator"></div>
                <strong>Button Labels</strong>
                <ha-formfield .label=${"Hide Text Under Buttons"}><ha-switch .checked=${this._config.popup_hide_button_text === true} @change=${(ev) => this._switchChanged(ev, "popup_hide_button_text")}></ha-switch></ha-formfield>
                
                <div class="separator"></div>
                <strong>Popup Styling</strong>
                <ha-textfield label="Popup Slider Radius" type="number" .value=${this._config.popup_slider_radius ?? 12} @input=${(ev) => this._textChanged(ev, "popup_slider_radius")}></ha-textfield>

                <div class="separator"></div>
                <strong>History / Logbook</strong>
                <ha-select
                  label="Time Format"
                  .value=${this._config.popup_time_format || 'auto'}
                  @selected=${(ev) => this._dropdownChanged(ev, "popup_time_format")}
                  @closed=${(e) => e.stopPropagation()}
                  @click=${(e) => e.stopPropagation()}
                >
                  <mwc-list-item value="auto">Auto</mwc-list-item>
                  <mwc-list-item value="12">12-Hour Clock</mwc-list-item>
                  <mwc-list-item value="24">24-Hour Clock</mwc-list-item>
                </ha-select>
                
                <div class="separator"></div>
                <strong>Value Display</strong>
                <div class="side-by-side">
                    <ha-textfield label="Font Size (px)" type="number" .value=${this._config.popup_value_font_size ?? 36} @input=${(ev) => this._textChanged(ev, "popup_value_font_size")}></ha-textfield>
                    <ha-textfield label="Font Weight" type="number" .value=${this._config.popup_value_font_weight ?? 300} @input=${(ev) => this._textChanged(ev, "popup_value_font_weight")}></ha-textfield>
                </div>
                
                <div class="separator"></div>
                <strong>Label Display (Color/Temp Names)</strong>
                <div class="side-by-side">
                    <ha-textfield label="Font Size (px)" type="number" .value=${this._config.popup_label_font_size ?? 16} @input=${(ev) => this._textChanged(ev, "popup_label_font_size")}></ha-textfield>
                    <ha-textfield label="Font Weight" type="number" .value=${this._config.popup_label_font_weight ?? 400} @input=${(ev) => this._textChanged(ev, "popup_label_font_weight")}></ha-textfield>
                </div>
                
                <div class="separator"></div>
                <strong>Highlighted Button Styling</strong>
                <p style="font-size: 11px; opacity: 0.7; margin-top: 0;">Customize the appearance of active/selected buttons in popups.</p>
                <ha-textfield label="Highlight Color" .value=${this._config.popup_highlight_color || ""} @input=${(ev) => this._textChanged(ev, "popup_highlight_color")} placeholder="var(--primary-color)"></ha-textfield>
                <ha-textfield label="Highlight Text Color" .value=${this._config.popup_highlight_text_color || ""} @input=${(ev) => this._textChanged(ev, "popup_highlight_text_color")} placeholder="var(--text-primary-color)"></ha-textfield>
                <div class="side-by-side">
                  <ha-textfield label="Border Radius (px)" type="number" .value=${this._config.popup_highlight_radius ?? ""} @input=${(ev) => this._textChanged(ev, "popup_highlight_radius")} placeholder="8"></ha-textfield>
                  <ha-textfield label="Opacity" type="number" step="0.1" min="0" max="1" .value=${this._config.popup_highlight_opacity ?? ""} @input=${(ev) => this._textChanged(ev, "popup_highlight_opacity")} placeholder="1"></ha-textfield>
                </div>
                <div class="side-by-side">
                  <ha-select 
                    label="Border Style" 
                    .value=${this._config.popup_highlight_border_style || "none"} 
                    @selected=${(ev) => this._dropdownChanged(ev, "popup_highlight_border_style")}
                    @closed=${(e) => e.stopPropagation()}
                    @click=${(e) => e.stopPropagation()}
                  >
                    ${borders.map(b => html`<mwc-list-item .value=${b}>${b}</mwc-list-item>`)}
                  </ha-select>
                  <ha-textfield label="Border Width" .value=${this._config.popup_highlight_border_width || ""} @input=${(ev) => this._textChanged(ev, "popup_highlight_border_width")} placeholder="0"></ha-textfield>
                </div>
                <ha-textfield label="Border Color" .value=${this._config.popup_highlight_border_color || ""} @input=${(ev) => this._textChanged(ev, "popup_highlight_border_color")}></ha-textfield>
                <ha-textfield label="Box Shadow" .value=${this._config.popup_highlight_box_shadow || ""} @input=${(ev) => this._textChanged(ev, "popup_highlight_box_shadow")} placeholder="0 2px 8px rgba(0,0,0,0.2)"></ha-textfield>
                
                <div class="separator"></div>
                <strong>Non-Highlighted Button Styling</strong>
                <p style="font-size: 11px; opacity: 0.7; margin-top: 0;">Customize the appearance of inactive buttons in popups.</p>
                <ha-textfield label="Background Color" .value=${this._config.popup_button_bg || ""} @input=${(ev) => this._textChanged(ev, "popup_button_bg")} placeholder="transparent"></ha-textfield>
                <ha-textfield label="Text Color" .value=${this._config.popup_button_text_color || ""} @input=${(ev) => this._textChanged(ev, "popup_button_text_color")} placeholder="var(--primary-text-color)"></ha-textfield>
                <div class="side-by-side">
                  <ha-textfield label="Border Radius (px)" type="number" .value=${this._config.popup_button_radius ?? ""} @input=${(ev) => this._textChanged(ev, "popup_button_radius")} placeholder="8"></ha-textfield>
                  <ha-textfield label="Opacity" type="number" step="0.1" min="0" max="1" .value=${this._config.popup_button_opacity ?? ""} @input=${(ev) => this._textChanged(ev, "popup_button_opacity")} placeholder="1"></ha-textfield>
                </div>
                <div class="side-by-side">
                  <ha-select 
                    label="Border Style" 
                    .value=${this._config.popup_button_border_style || "none"} 
                    @selected=${(ev) => this._dropdownChanged(ev, "popup_button_border_style")}
                    @closed=${(e) => e.stopPropagation()}
                    @click=${(e) => e.stopPropagation()}
                  >
                    ${borders.map(b => html`<mwc-list-item .value=${b}>${b}</mwc-list-item>`)}
                  </ha-select>
                  <ha-textfield label="Border Width" .value=${this._config.popup_button_border_width || ""} @input=${(ev) => this._textChanged(ev, "popup_button_border_width")} placeholder="0"></ha-textfield>
                </div>
                <ha-textfield label="Border Color" .value=${this._config.popup_button_border_color || ""} @input=${(ev) => this._textChanged(ev, "popup_button_border_color")}></ha-textfield>
             </div>
          </div>

          <div class="accordion-group">
            ${renderHeader("Actions", "actions")}
             <div class="accordion-content ${this._closedDetails['actions'] ? 'hidden' : ''}">
                <div class="sub-accordion">
                  ${renderHeader("Tap Action", "action_tap")}
                  <div class="sub-accordion-content ${this._closedDetails['action_tap'] ? 'hidden' : ''}">
                    ${renderActionDropdown("Tap Action", "tap_action")}
                  </div>
                </div>
                
                <div class="sub-accordion">
                  ${renderHeader("Double Tap Action", "action_double_tap")}
                  <div class="sub-accordion-content ${this._closedDetails['action_double_tap'] ? 'hidden' : ''}">
                    ${renderActionDropdown("Double Tap Action", "double_tap_action")}
                  </div>
                </div>
                
                <div class="sub-accordion">
                  ${renderHeader("Hold Action", "action_hold")}
                  <div class="sub-accordion-content ${this._closedDetails['action_hold'] ? 'hidden' : ''}">
                    ${renderActionDropdown("Hold Action", "hold_action")}
                  </div>
                </div>
                
                <div class="sub-accordion">
                  ${renderHeader("Icon Tap Action", "action_icon_tap")}
                  <div class="sub-accordion-content ${this._closedDetails['action_icon_tap'] ? 'hidden' : ''}">
                    ${renderActionDropdown("Icon Tap Action", "icon_tap_action")}
                  </div>
                </div>
                
                <div class="sub-accordion">
                  ${renderHeader("Icon Hold Action", "action_icon_hold")}
                  <div class="sub-accordion-content ${this._closedDetails['action_icon_hold'] ? 'hidden' : ''}">
                    ${renderActionDropdown("Icon Hold Action", "icon_hold_action")}
                  </div>
                </div>
                
                <div class="sub-accordion">
                  ${renderHeader("Icon Double Tap Action", "action_icon_double_tap")}
                  <div class="sub-accordion-content ${this._closedDetails['action_icon_double_tap'] ? 'hidden' : ''}">
                    ${renderActionDropdown("Icon Double Tap Action", "icon_double_tap_action")}
                  </div>
                </div>
             </div>
          </div>

          <div class="accordion-group">
            ${renderHeader("Offsets", "offsets")}
             <div class="accordion-content ${this._closedDetails['offsets'] ? 'hidden' : ''}">
                <p style="font-size: 11px; opacity: 0.7; margin-top: 0;">Adjust X/Y position in pixels.</p>
                <div class="side-by-side">
                    <ha-textfield label="Name X" type="number" .value=${this._config.name_offset_x || 0} @input=${(ev) => this._textChanged(ev, "name_offset_x")}></ha-textfield>
                    <ha-textfield label="Name Y" type="number" .value=${this._config.name_offset_y || 0} @input=${(ev) => this._textChanged(ev, "name_offset_y")}></ha-textfield>
                </div>
                <div class="side-by-side">
                    <ha-textfield label="State X" type="number" .value=${this._config.state_offset_x || 0} @input=${(ev) => this._textChanged(ev, "state_offset_x")}></ha-textfield>
                    <ha-textfield label="State Y" type="number" .value=${this._config.state_offset_y || 0} @input=${(ev) => this._textChanged(ev, "state_offset_y")}></ha-textfield>
                </div>
                <div class="side-by-side">
                    <ha-textfield label="Icon X" type="number" .value=${this._config.icon_offset_x || 0} @input=${(ev) => this._textChanged(ev, "icon_offset_x")}></ha-textfield>
                    <ha-textfield label="Icon Y" type="number" .value=${this._config.icon_offset_y || 0} @input=${(ev) => this._textChanged(ev, "icon_offset_y")}></ha-textfield>
                </div>
                <div class="side-by-side">
                    <ha-textfield label="Icon Badge X" type="number" .value=${this._config.badge_offset_x || 0} @input=${(ev) => this._textChanged(ev, "badge_offset_x")}></ha-textfield>
                    <ha-textfield label="Icon Badge Y" type="number" .value=${this._config.badge_offset_y || 0} @input=${(ev) => this._textChanged(ev, "badge_offset_y")}></ha-textfield>
                </div>
                <div class="side-by-side">
                    <ha-textfield label="Info X" type="number" .value=${this._config.brightness_offset_x || 0} @input=${(ev) => this._textChanged(ev, "brightness_offset_x")}></ha-textfield>
                    <ha-textfield label="Info Y" type="number" .value=${this._config.brightness_offset_y || 0} @input=${(ev) => this._textChanged(ev, "brightness_offset_y")}></ha-textfield>
                </div>
                ${isClimate ? html`
                <div class="side-by-side">
                    <ha-textfield label="Temp Badge X" type="number" .value=${this._config.temp_badge_offset_x || 0} @input=${(ev) => this._textChanged(ev, "temp_badge_offset_x")}></ha-textfield>
                    <ha-textfield label="Temp Badge Y" type="number" .value=${this._config.temp_badge_offset_y || 0} @input=${(ev) => this._textChanged(ev, "temp_badge_offset_y")}></ha-textfield>
                </div>
                ` : ''}
             </div>
          </div>

        </div>
      `;
    }
    
    _toggleHeader(e, key) {
        // Check if the click target is an interactive element or inside one
        const target = e.target;
        const header = e.currentTarget;
        
        // Don't toggle if clicking on interactive elements like selectors, dropdowns, buttons, inputs
        const interactiveSelectors = [
            'ha-selector',
            'ha-select', 
            'mwc-list-item',
            'ha-textfield',
            'input',
            'button',
            'ha-switch',
            'ha-icon-button',
            'mwc-button',
            'ha-target-picker',
            'ha-entity-picker',
            'ha-service-picker',
            '.hki-editor-clear'
        ];
        
        // Check if target or any parent (up to header) matches interactive selectors
        let element = target;
        while (element && element !== header) {
            if (interactiveSelectors.some(selector => element.matches?.(selector))) {
                return; // Don't toggle
            }
            element = element.parentElement;
        }
        
        // Safe to toggle - click was on header itself or non-interactive child (like span/ha-icon)
        this._toggle(key);
    }

    _toggle(key) {
        this._closedDetails = { ...this._closedDetails, [key]: !this._closedDetails[key] };
    }
    
    // For HA Selectors (Entity, Icon)
    _selectorChanged(ev, field) { 
        ev.stopPropagation(); 
        const value = ev.detail.value;
        // If the user changes the main entity, prefer the entity's default icon.
        // Only keep a custom icon if the user explicitly set one (i.e. not the old default lightbulb fallback).
        if (field === 'entity') {
          const next = { ...this._config, [field]: value };
          if (!next.icon || next.icon === 'mdi:lightbulb') {
            next.icon = '';
          }
          this._fireChanged(next);
          return;
        }
        this._fireChanged({ ...this._config, [field]: value }); 
    }

    _toHaActionSelectorValue(actionConfig) {
      // Convert your lovelace-style config -> HA automation action list
      if (!actionConfig?.perform_action) return [];
    
      return [{
        service: actionConfig.perform_action,
        target: actionConfig.target,
        data: actionConfig.data,
      }];
    }
    
    _fromHaActionSelectorValue(ev, configKey) {
      ev.stopPropagation();
    
      const list = ev.detail?.value;
      const currentConfig = this._config[configKey] || {};
    
      // Ignore events without detail or value
      if (!ev.detail || ev.detail.value === undefined) {
        return;
      }
    
      // cleared
      if (!Array.isArray(list) || list.length === 0) {
        // Only fire if we actually had a value before
        if (currentConfig.perform_action) {
          this._fireChanged({ ...this._config, [configKey]: { action: "perform-action" } });
        }
        return;
      }
    
      const a = list[0] || {};
    
      // HA's action selector often uses `action:` for service calls
      const act = a.action || a.service || "";
      
      // Ignore incomplete actions (no service specified)
      if (!act) {
        return;
      }
    
      const updated = {
        action: "perform-action",
        perform_action: act,
      };
    
      if (a.target && Object.keys(a.target).length) updated.target = a.target;
      if (a.data && Object.keys(a.data).length) updated.data = a.data;
    
      // Only fire change if the value actually changed
      const hasChanged = 
        currentConfig.perform_action !== updated.perform_action ||
        JSON.stringify(currentConfig.target || {}) !== JSON.stringify(updated.target || {}) ||
        JSON.stringify(currentConfig.data || {}) !== JSON.stringify(updated.data || {});
      
      if (hasChanged) {
        this._fireChanged({ ...this._config, [configKey]: updated });
      }
    }

    
    // For Dropdowns (ha-select)
    _dropdownChanged(ev, field) {
        ev.stopPropagation();
        const value = ev.target.value;
        this._fireChanged({ ...this._config, [field]: value });
    }

    // For Action Dropdowns - merges 'action' string back into an object
    _actionChanged(ev, field) {
        ev.stopPropagation();
        const actionValue = ev.target.value;
        // Merge with existing action config to preserve other properties if they exist (though simplified UI mostly overwrites)
        const currentActionConfig = this._config[field] || {};
        const newActionConfig = { ...currentActionConfig, action: actionValue };
        this._fireChanged({ ...this._config, [field]: newActionConfig });
    }

    _actionFieldChanged(ev, actionKey, fieldName, isJSON = false) {
      ev.stopPropagation();
    
      let value = ev.detail?.value ?? ev.target?.value;  // ✅ supports ha-selector + text/select
    
      if (isJSON && value) {
        try { value = JSON.parse(value); } catch (e) { return; }
      }
    
      const currentActionConfig = this._config[actionKey] || {};
      const newActionConfig = { ...currentActionConfig, [fieldName]: value };
      this._fireChanged({ ...this._config, [actionKey]: newActionConfig });
    }


    _actionFieldYamlChanged(ev, actionKey, fieldName) {
        ev.stopPropagation();
        const value = ev.detail.value;
        const currentActionConfig = this._config[actionKey] || {};
        const newActionConfig = { ...currentActionConfig, [fieldName]: value };
        this._fireChanged({ ...this._config, [actionKey]: newActionConfig });
    }

    _actionFieldSelectorChanged(ev, actionKey, fieldName) {
      ev.stopPropagation();
      const value = ev.detail?.value;
    
      const currentActionConfig = this._config[actionKey] || {};
      const newActionConfig = { ...currentActionConfig };
    
      // Only special-case "target"
      if (fieldName === "target") {
        const t = value || {};
    
        const isEmptyVal = (v) => {
          if (v === undefined || v === null) return true;
          if (Array.isArray(v)) return v.length === 0;
          if (typeof v === "string") return v.trim() === "";
          return false;
        };
    
        const empty =
          isEmptyVal(t.entity_id) &&
          isEmptyVal(t.device_id) &&
          isEmptyVal(t.area_id) &&
          isEmptyVal(t.floor_id) &&
          isEmptyVal(t.label_id);
    
        if (empty) {
          delete newActionConfig.target;   // ✅ THIS is what makes “last one” removable
        } else {
          newActionConfig.target = t;
        }
      } else {
        newActionConfig[fieldName] = value;
      }
    
      this._fireChanged({ ...this._config, [actionKey]: newActionConfig });
    }

    // For Textfields (ha-textfield)
    _textChanged(ev, field) { 
        ev.stopPropagation(); 
        let value = ev.target.value; 
        if (ev.target.type === "number") value = parseFloat(value); 
        this._fireChanged({ ...this._config, [field]: value }); 
    }

    // For Switches (ha-switch)
    _switchChanged(ev, field) { 
        ev.stopPropagation(); 
        this._fireChanged({ ...this._config, [field]: ev.target.checked }); 
    }
    
    _fireChanged(newConfig) {
        // Clean up empty values that shouldn't be in YAML
        const cleaned = { ...newConfig };
        
        // Remove empty icon
        if (cleaned.icon === '') {
          delete cleaned.icon;
        }
        
        // Remove empty or default double_tap_action
        if (cleaned.double_tap_action && 
            (!cleaned.double_tap_action.action || cleaned.double_tap_action.action === 'none')) {
          delete cleaned.double_tap_action;
        }
        
        this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: cleaned }, bubbles: true, composed: true }));
    }
    
    static get styles() { 
        return css`
            .card-config { 
                display: flex; 
                flex-direction: column; 
                gap: 12px; 
                padding: 8px; 
            }
            
            /* ALLOW OVERFLOW FOR DROPDOWNS */
            .accordion-group { 
                background: var(--secondary-background-color);
                border-radius: 4px;
                margin-bottom: 8px;
                overflow: visible;
                border: 1px solid var(--divider-color);
            }
            
            .accordion-header { 
                padding: 12px;
                cursor: pointer;
                font-weight: 600;
                background: var(--primary-background-color);
                border-bottom: 1px solid var(--divider-color);
                display: flex;
                align-items: center;
                justify-content: space-between;
            }

            .accordion-header ha-icon {
                font-weight: bold;
                font-size: 1.2em;
            }
            
            .accordion-content { 
                padding: 12px;
                display: flex;
                flex-direction: column;
                gap: 12px;
                overflow: visible; 
            }
            
            .accordion-content.hidden { display: none; }
            
            .sub-accordion {
                background: var(--secondary-background-color);
                border-radius: 4px;
                margin-bottom: 8px;
                overflow: visible;
                border: 1px solid var(--divider-color);
            }
            
            .sub-accordion .accordion-header {
                padding: 12px;
                font-size: 14px;
                font-weight: 600;
                background: var(--primary-background-color);
                border-bottom: 1px solid var(--divider-color);
            }
            
            .sub-accordion-content {
                padding: 12px;
                display: flex;
                flex-direction: column;
                gap: 12px;
                overflow: visible;
            }
            
            .sub-accordion-content.hidden { display: none; }
            
            .side-by-side { 
                display: grid; 
                grid-template-columns: 1fr 1fr; 
                gap: 12px; 
                margin-bottom: 8px; 
            }

            /* Text override template helpers */
            .tpl-field {
                margin-top: 10px;
            }
            .tpl-title {
                font-weight: 600;
                margin-bottom: 4px;
            }
            .tpl-desc {
                font-size: 11px;
                opacity: 0.7;
                margin-bottom: 6px;
            }
            ha-code-editor {
                width: 100%;
            }
            
            .sub-section { 
                border: 1px solid var(--divider-color); 
                padding: 10px; 
                border-radius: 6px; 
                margin-bottom: 8px; 
            }
            
            .separator { 
                height: 1px; 
                background: var(--divider-color); 
                margin: 12px 0; 
            }
            
            .action-config-section {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
            
            .action-config-section strong {
                font-size: 13px;
                opacity: 0.7;
                margin-bottom: 4px;
            }
            
            .perform-action-config {
                display: flex;
                flex-direction: column;
                gap: 12px;
            }
            
            .perform-action-config ha-selector,
            .perform-action-config ha-textfield,
            .perform-action-config ha-yaml-editor {
                width: 100%;
            }
            
            
            .hki-editor-clear{
                width: 40px;
                height: 40px;
                border-radius: 50%;
                border: 1px solid var(--divider-color);
                background: var(--card-background-color);
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                padding: 0;
            }
            .hki-editor-clear ha-icon{
                --mdc-icon-size: 20px;
            }
            .hki-editor-clear:hover{
                background: var(--secondary-background-color);
            }
.checkbox-grid { 
                display: grid; 
                grid-template-columns: 1fr 1fr; 
                gap: 8px; 
            }
            
            .grid-layout-editor {
                display: flex;
                flex-direction: column;
                gap: 16px;
                margin: 12px 0;
            }
            
            .element-palette {
                display: flex;
                gap: 8px;
                flex-wrap: wrap;
            }
            
            .palette-element {
                flex: 1;
                min-width: 80px;
                padding: 8px 12px;
                background: var(--card-background-color);
                border: 2px solid var(--divider-color);
                border-radius: 6px;
                cursor: pointer;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 4px;
                position: relative;
                transition: all 0.2s;
            }
            
            .palette-element:hover {
                border-color: var(--primary-color);
                transform: translateY(-2px);
            }
            
            .palette-element.selected {
                border-color: var(--primary-color);
                background: var(--primary-color);
                color: white;
            }
            
            .palette-element ha-icon {
                --mdc-icon-size: 20px;
            }
            
            .palette-element span {
                font-size: 11px;
                font-weight: 500;
            }
            
            .element-count {
                position: absolute;
                top: 4px;
                right: 4px;
                background: var(--primary-color);
                color: white;
                border-radius: 50%;
                width: 18px;
                height: 18px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 10px;
                font-weight: bold;
            }
            
            .palette-element.selected .element-count {
                background: white;
                color: var(--primary-color);
            }
            
            .layout-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 8px;
                padding: 12px;
                background: var(--secondary-background-color);
                border-radius: 8px;
                border: 2px solid var(--divider-color);
            }
            
            .grid-cell {
                aspect-ratio: 1;
                background: var(--card-background-color);
                border: 2px dashed var(--divider-color);
                border-radius: 6px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 4px;
                cursor: pointer;
                transition: all 0.2s;
                min-height: 60px;
            }
            
            .grid-cell:hover {
                border-color: var(--primary-color);
                transform: scale(1.05);
            }
            
            .grid-cell.filled {
                border-style: solid;
                background: var(--primary-color);
                color: white;
            }
            
            .grid-cell.filled ha-icon {
                --mdc-icon-size: 24px;
            }
            
            .grid-cell.filled span {
                font-size: 10px;
                font-weight: 500;
            }
            
            .grid-cell.selectable {
                animation: pulse 1s infinite;
            }
            
            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.6; }
            }
            
            .grid-cell .empty-indicator {
                font-size: 24px;
                opacity: 0.3;
                font-weight: 300;
            }
            
            .reset-order-btn {
                width: 100%;
                padding: 10px;
                background: var(--secondary-background-color);
                border: 1px solid var(--divider-color);
                border-radius: 6px;
                cursor: pointer;
                font-weight: 500;
                margin-top: 8px;
            }
            
            .reset-order-btn:hover {
                background: var(--primary-color);
                color: white;
            }
            
            ha-textfield, ha-selector, ha-select, ha-yaml-editor { 
                width: 100%; 
                display: block; 
                margin-bottom: 8px; 
            }
            
            ha-formfield { 
                display: flex; 
                align-items: center; 
                height: 40px; 
            }
        `; 
    }
  }

  // Guard against double-registration (can happen on reloads / caching)
  if (!customElements.get(CARD_TYPE)) {
    customElements.define(CARD_TYPE, HkiButtonCard);
  }
  if (!customElements.get(EDITOR_TAG)) {
    customElements.define(EDITOR_TAG, HkiButtonCardEditor);
  }
  
  window.customCards = window.customCards || [];
  window.customCards.push({ 
    type: CARD_TYPE, 
    name: "HKI Button Card", 
    description: "Customizable buttons with built-in popups.", 
    preview: true 
  });

})();
