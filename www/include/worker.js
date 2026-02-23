/**
 * Narzędzie do zarządzania stylami (wzorzec Singleton / Static)
 */
class StyleManager {
    static injectedStyles = new Set();

    static injectOnce(id, css) {
        if (!this.injectedStyles.has(id)) {
            const style = document.createElement('style');
            style.id = id;
            style.textContent = css;
            document.head.appendChild(style);
            this.injectedStyles.add(id);
        }
    }
}

/**
 * Klasa bazowa dla wszystkich widgetów
 */
class Widget {
    constructor(config, index, app) {
        this.config = config;
        this.index = index;
        this.app = app; // Referencja do głównej aplikacji (np. dla flagi tooltips)
        this.refreshMs = config.settings.refreshMs || 5000;
        this.url = config.settings.url || gSettings.page.glances;
        this.container = null;
    }

    // Tworzy wspólną ramkę (kontener)
    createContainer(innerHTMLContent) {
        const hostDiv = document.getElementById('areaWidgets');
        const wgtDiv = document.createElement('div');
        wgtDiv.className = 'col col-sm-6';

        if (this.config.info) {
            this.app.enableTooltips = true;
            wgtDiv.setAttribute("data-bs-toggle", "tooltip");
            wgtDiv.setAttribute("data-bs-placement", "bottom");
            wgtDiv.setAttribute("data-bs-title", this.config.info);
        }

        const titleHtml = this.config.name ? `<h7>${this.config.name}</h7><hr>` : '';
        wgtDiv.innerHTML = `${titleHtml}${innerHTMLContent}`;
        
        hostDiv.appendChild(wgtDiv);
        this.container = wgtDiv; // Zapisujemy referencję do DOM
    }

    // Metody do nadpisania w klasach potomnych
    render() { throw new Error("Metoda render() musi być nadpisana"); }
    async refresh() { throw new Error("Metoda refresh() musi być nadpisana"); }

    // Inicjalizacja widgetu
    init() {
        this.render();
        this.refresh();
        setInterval(() => this.refresh(), this.refreshMs);
    }
}

/**
 * Widget CPU
 */
class CpuWidget extends Widget {
    render() {
        const content = `
            <div class="widget widgetCpu">
                <div class="d-flex align-items-center mb-2" style="gap: 10px;">
                    <i class="fa fa-microchip" style="width: 20px; text-align: center;"></i>
                    <div class="progress-container" style="flex: 1; margin: 0;">
                        <div id="cpuBar${this.index}" class="progress-bar" style="width: 0%;"></div>
                    </div>
                    <span id="cpuPrct${this.index}" class="text-end" style="min-width: 45px; font-family: monospace;">0%</span>
                </div>
                <div class="d-flex align-items-center" style="gap: 10px;">
                    <i class="fa fa-temperature-low" style="width: 20px; text-align: center;"></i>
                    <div class="progress-container" style="flex: 1; margin: 0;">
                        <div id="tempBar${this.index}" class="progress-bar" style="width: 0%; background-color: #ffc107;"></div>
                    </div>
                    <span id="cpuTemp${this.index}" class="text-end" style="min-width: 45px; font-family: monospace;">-</span>
                </div>
            </div>`;
        this.createContainer(content);
    }

    async refresh() {
        try {
            const [quicklookRes, sensorsRes] = await Promise.all([
                fetch(`${this.url}api/4/quicklook`).then(res => res.json()),
                fetch(`${this.url}api/4/sensors`).then(res => res.json())
            ]);

            // Aktualizacja Tytułu
            if (quicklookRes.cpu_name && this.container) {
                const titleEl = this.container.querySelector('h7');
                if (titleEl) titleEl.innerText = `${this.config.name} - ${quicklookRes.cpu_name}`;
            }

            // Użycie CPU
            const cpuUsage = quicklookRes.cpu;
            const barEl = document.getElementById(`cpuBar${this.index}`);
            if (barEl) barEl.style.width = `${cpuUsage}%`;

            const textEl = document.getElementById(`cpuPrct${this.index}`);
            if (textEl) {
                textEl.innerText = `${cpuUsage}%`;
                textEl.classList.remove('text-warning-bold', 'text-danger-bold');
                if (cpuUsage >= 90) textEl.classList.add('text-danger-bold');
                else if (cpuUsage >= 70) textEl.classList.add('text-warning-bold');
            }
            
            // Temperatura CPU
            const pkgSensor = sensorsRes.find(o => o.label === "Package id 0" || o.label === "CPU Temp");
            const cpuTemp = pkgSensor ? pkgSensor.value : 0;

            const tempBarEl = document.getElementById(`tempBar${this.index}`);
            if (tempBarEl) tempBarEl.style.width = `${Math.min(cpuTemp, 100)}%`;
            
            const tempTextEl = document.getElementById(`cpuTemp${this.index}`);
            if (tempTextEl) tempTextEl.innerText = pkgSensor ? `${pkgSensor.value}°C` : '-';
            
        } catch (error) {
            console.error(`CPU fetch error (Widget ${this.index}):`, error);
        }
    }
}

/**
 * Widget Pamięci (Memory)
 */
class MemoryWidget extends Widget {
    render() {
        const content = `
            <div class="widget widgetMemory">
                <div class="d-flex align-items-center" style="gap: 10px;">
                    <i class="fa fa-memory" style="width: 20px; text-align: center;"></i>
                    <div class="progress-container" style="flex: 1; margin: 0;">
                        <div id="memBar${this.index}" class="progress-bar" style="width: 0%;"></div>
                    </div>
                    <span id="memPrct${this.index}" class="text-end" style="min-width: 45px; font-family: monospace;">0%</span>
                </div>
            </div>`;
        this.createContainer(content);
    }

    async refresh() {
        try {
            const res = await fetch(`${this.url}api/4/quicklook`).then(r => r.json());
            const usage = res.mem;

            const textEl = document.getElementById(`memPrct${this.index}`);
            if (textEl) {
                textEl.innerText = `${usage}%`;
                textEl.classList.remove('text-warning-bold', 'text-danger-bold');
                if (usage >= 90) textEl.classList.add('text-danger-bold');
                else if (usage >= 70) textEl.classList.add('text-warning-bold');
            }

            const barEl = document.getElementById(`memBar${this.index}`);
            if (barEl) barEl.style.width = `${usage}%`;
        } catch (error) {
            console.error(`Memory fetch error (Widget ${this.index}):`, error);
        }
    }
}

/**
 * Widget ZFS
 */
class ZfsWidget extends Widget {
    render() {
        const datasets = this.config.settings.datasets || [];
        let rowsHtml = '';
        
        datasets.forEach((dsConfig, i) => {
            const dsName = dsConfig.name;
            const displayLabel = dsConfig.label || (dsName.includes('/') ? dsName.split('/').pop() : dsName);
            const iconClass = dsConfig.isSum === true ? 'fa-layer-group' : 'fa-hdd';
            const labelColor = dsConfig.isSum ? '#ffc107' : 'inherit';
            
            rowsHtml += `
                <div class="d-flex align-items-center ${i < datasets.length - 1 ? 'mb-2' : ''}" style="gap: 10px;">
                    <i class="fa ${iconClass}" style="width: 15px; text-align: center; color: ${labelColor};"></i>
                    <span class="text-start text-truncate" style="width: 80px; font-size: 0.75rem; font-weight: bold; color: ${labelColor};" title="${dsName}">
                        ${displayLabel}
                    </span>
                    <div class="progress-container" style="flex: 1; margin: 0;">
                        <div id="zfsBar${this.index}_${i}" class="progress-bar" style="width: 0%; background-color: #0dcaf0;"></div>
                    </div>
                    <span id="zfsText${this.index}_${i}" class="text-end" style="min-width: 140px; font-family: monospace; font-size: 0.8rem; color: ${labelColor};">
                        ...
                    </span>
                </div>`;
        });

        this.createContainer(`<div class="widget widgetZfs">${rowsHtml}</div>`);
    }

    async refresh() {
        const datasetsConfig = this.config.settings.datasets || [];
        try {
            const response = await fetch('include/zfs-data.php');
            const allData = await response.json();
            
            if (allData.error) throw new Error(allData.error);

            datasetsConfig.forEach((dsConfig, i) => {
                const ds = allData.find(item => item.name === dsConfig.name);
                const barEl = document.getElementById(`zfsBar${this.index}_${i}`);
                const textEl = document.getElementById(`zfsText${this.index}_${i}`);

                if (ds && barEl && textEl) {
                    const totalBytes = ds.used + ds.avail;
                    const usedGB = (ds.used / 1073741824).toFixed(1);
                    const totalGB = (totalBytes / 1073741824).toFixed(1);
                    const usagePct = ((ds.used / totalBytes) * 100).toFixed(1);

                    barEl.style.width = `${usagePct}%`;
                    barEl.style.backgroundColor = usagePct >= 90 ? '#dc3545' : '#0dcaf0';

                    if (dsConfig.isSum) {
                        const titleEl = this.container?.querySelector('h7');
                        if (titleEl) titleEl.innerText = `${this.config.name} (${totalGB} GB)`;
                    }

                    textEl.innerHTML = `${usedGB} GB (${usagePct}%)`;

                    if (parseFloat(usagePct) >= 90) textEl.classList.add('text-danger-bold');
                    else textEl.classList.remove('text-danger-bold');
                }
            });
        } catch (error) {
            console.error(`ZFS fetch error (Widget ${this.index}):`, error);
        }
    }
}

/**
 * Widget Proxmox
 */
class ProxmoxWidget extends Widget {
    render() {
        StyleManager.injectOnce('proxmox-widget-styles', `
            .bar-container, .dual-bar-container { background: #ddd; border-radius: 4px; height: 6px; margin: 4px 0 10px; position: relative; overflow: hidden; }
            .bar { height: 100%; position: absolute; top: 0; left: 0; transition: width 0.3s ease; opacity: 0.8; }
            .cpu-bar { background: linear-gradient(to right, #4caf50, #81c784); }
            .ram-bar { background: linear-gradient(to right, #2196f3, #64b5f6); }
        `);

        const content = `
            <div class="widget widgetProxmox">
                <details closed>
                    <summary class="d-flex">
                        <span class="node-ressources">
                            <span><i class="fa fa-microchip"></i> Loading...</span>
                            <span><i class="fa fa-memory"></i> Loading...</span>
                        </span>
                    </summary>
                    <div class="vm-list">
                        <i class="fa fa-server"></i> VMs & Containers Loading...
                    </div>
                </details>
                <details closed>
                    <summary class="d-flex">
                        <span class="storage-summary">
                            <span><i class="fa fa-database"></i> Loading...</span>
                        </span>
                    </summary>
                    <div class="storage-list"></div>
                </details>
            </div>`;
        this.createContainer(content);
    }

    async refresh() {
        if (!this.container) return;
        const innerWidget = this.container.querySelector('.widgetProxmox');
        if (!innerWidget) return;

        const settings = this.config.settings;
        const options = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: settings.url, token: settings.token, node: settings.node })
        };

        const updateFail = (sel, fallback = 'error') => {
            const el = innerWidget.querySelector(sel);
            if (el) el.innerHTML = `<span class="text-danger">${fallback}</span>`;
        };

        try {
            const response = await fetch('include/proxmox-widget.php', options);
            const data = await response.json();

            if (typeof data !== 'object' || typeof data.node !== 'object' || !Array.isArray(data.qemu) || !Array.isArray(data.lxc) || !Array.isArray(data.storage)) {
                throw new Error("Invalid Proxmox API data format");
            }

            // Node Resources
            const nodeCPUUsedPercentage = data.node.cpu ? (data.node.cpu * 100).toFixed(2) : "N/A";
            const nodeMemoryUsedMB = data.node.memory ? parseInt(data.node.memory.used / 1024 / 1024, 10) : "N/A";
            const nodeMemoryUsedPercentage = data.node.memory ? (data.node.memory.used / data.node.memory.total * 100).toFixed(2) : 0;
            const cpuFirst = parseFloat(nodeCPUUsedPercentage) >= parseFloat(nodeMemoryUsedPercentage);

            innerWidget.querySelector('.node-ressources').innerHTML = `
                <span><i class="fa fa-microchip"></i> ${nodeCPUUsedPercentage}%</span>
                <span><i class="fa fa-memory"></i> ${nodeMemoryUsedMB} MB</span>
                <div class="dual-bar-container">
                    <div class="bar cpu-bar" style="width: ${nodeCPUUsedPercentage}%; z-index: ${cpuFirst ? 1 : 2};"></div>
                    <div class="bar ram-bar" style="width: ${nodeMemoryUsedPercentage}%; z-index: ${cpuFirst ? 2 : 1};"></div>
                </div>
            `;

            // VMs List
            const allVMs = [...data.qemu.map(vm => ({ ...vm, type: 'qemu' })), ...data.lxc.map(vm => ({ ...vm, type: 'lxc' }))]
                .sort((a, b) => a.vmid - b.vmid);

            const vmsHtml = allVMs.map(vm => {
                const vmCPUUsedPercentage = (vm.cpu * 100).toFixed(2);
                const vmMemoryUsedMB = (vm.mem / 1024 / 1024).toFixed(2);
                const vmMemoryMax = vm.maxmem || (32 * 1024 * 1024 * 1024);
                const vmMemoryUsedPercentage = ((vm.mem / vmMemoryMax) * 100).toFixed(2);
                const isCpuFirst = parseFloat(vmCPUUsedPercentage) >= parseFloat(vmMemoryUsedPercentage);
                
                return `
                    <li>
                        <strong>${vm.vmid} - ${vm.name}${vm.type === 'lxc' ? ' (LXC)' : ''}</strong>
                        <span><i class="fa fa-microchip"></i> ${vmCPUUsedPercentage}%</span>
                        <span><i class="fa fa-memory"></i> ${vmMemoryUsedMB} MB</span>
                        <div class="dual-bar-container">
                            <div class="bar cpu-bar" style="width: ${vmCPUUsedPercentage}%; z-index: ${isCpuFirst ? 1 : 2};"></div>
                            <div class="bar ram-bar" style="width: ${vmMemoryUsedPercentage}%; z-index: ${isCpuFirst ? 2 : 1};"></div>
                        </div>
                    </li>`;
            }).join('');

            innerWidget.querySelector('.vm-list').innerHTML = `<i class="fa fa-server"></i> VMs & Containers<ul class="vm-items">${vmsHtml}</ul>`;

            // Storage
            let storageUsedGB = 0;
            let storageTotalGB = 0;

            const storageHtml = [...data.storage].sort((a, b) => a.storage.localeCompare(b.storage)).map(item => {
                const usedGB = item.used / 1024 / 1024 / 1024;
                const totalGB = item.total / 1024 / 1024 / 1024;
                const usedPct = item.used_fraction * 100;
                
                storageUsedGB += usedGB;
                storageTotalGB += totalGB;

                return `
                    <li>
                        <span class="col-2"><i class="fa fa-hdd"></i></span> ${item.storage} - ${usedGB.toFixed(2)} GB (${usedPct.toFixed(2)}%)
                        <div class="bar-container"><div class="bar" style="width: ${usedPct}%; background: linear-gradient(to right, #9c27b0, #ce93d8);"></div></div>
                    </li>`;
            }).join('');

            innerWidget.querySelector('.storage-list').innerHTML = `<ul class="storage-items">${storageHtml}</ul>`;

            const totalStorageUsedPercentage = storageTotalGB > 0 ? (storageUsedGB / storageTotalGB * 100) : 0;
            innerWidget.querySelector('.storage-summary').innerHTML = `
                 <i class="fa fa-database"></i> ${storageUsedGB.toFixed(2)} GB (${totalStorageUsedPercentage.toFixed(2)}%)
                 <div class="bar-container"><div class="bar" style="width: ${totalStorageUsedPercentage}%; background: linear-gradient(to right, #9c27b0, #ce93d8);"></div></div>
            `;
            
        } catch (error) {
            console.error(`Proxmox fetch error (Widget ${this.index}):`, error);
            updateFail('.node-ressources');
            updateFail('.vm-list', 'VMs unavailable');
            updateFail('.storage-summary');
            const storageList = innerWidget.querySelector('.storage-list');
            if (storageList) storageList.innerHTML = '';
        }
    }
}

/**
 * Widget pfSense
 */
class PfsenseWidget extends Widget {
    constructor(config, index, app) {
        super(config, index, app);
        this.lastInBytes = null;
        this.lastOutBytes = null;
        this.lastUpdateTime = null;
    }

    render() {
        const content = `
            <div class="widget widgetPfsense">
                <div class="wan-ip"><i class="fa fa-globe"></i> Loading...</div>
                <div class="wanStatus"><i class="fa fa-signal"></i> Loading...</div>
                <div class="bandwidth"><i class="fa fa-gauge"></i> Loading...</div>
                <div class="ping"><i class="fa fa-clock"></i> Loading...</div>
            </div>`;
        this.createContainer(content);
    }

    async refresh() {
        if (!this.container) return;
        const innerWidget = this.container.querySelector('.widgetPfsense');
        if (!innerWidget) return;

        const settings = this.config.settings;
        const options = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: settings.url, xapikey: settings.xapikey })
        };

        const updateFail = sel => {
            const el = innerWidget.querySelector(sel);
            if (el) el.innerHTML = `<span class="text-danger">error</span>`;
        };

        try {
            const response = await fetch('include/pfsense-widget.php', options);
            const data = await response.json();

            if (!data || !data.dns || !data.interfaceStatus) {
                throw new Error("Invalid pfSense API data format");
            }

            const interfaceList = Array.isArray(data.interfaceStatus) ? data.interfaceStatus : [];
            const wanInterface = interfaceList.find(i => i.descr === "WAN") || {};
            
            innerWidget.querySelector('.wan-ip').innerHTML = `<i class="fa fa-globe"></i> ${wanInterface.ipaddr ?? "N/A"}`;
            innerWidget.querySelector('.wanStatus').innerHTML = `<i class="fa fa-signal"></i> ${wanInterface.status ?? "N/A"}`;
            
            // Przepustowość
            const now = Date.now();
            const secondsSinceLast = (now - (this.lastUpdateTime || now)) / 1000;
            const lastIn = this.lastInBytes || wanInterface.inbytes;
            const lastOut = this.lastOutBytes || wanInterface.outbytes;

            const wanBandwidthIn = ((wanInterface.inbytes - lastIn) * 8 / 1024 / 1024 / (secondsSinceLast || 1)).toFixed(2);
            const wanBandwidthOut = ((wanInterface.outbytes - lastOut) * 8 / 1024 / 1024 / (secondsSinceLast || 1)).toFixed(2);

            innerWidget.querySelector('.bandwidth').innerHTML = `<i class="fa fa-gauge"></i> ${wanBandwidthIn} / ${wanBandwidthOut} Mbit/s`;

            this.lastInBytes = wanInterface.inbytes;
            this.lastOutBytes = wanInterface.outbytes;
            this.lastUpdateTime = now;

            // DNS Ping
            const dnsList = Array.isArray(data.dns?.dnsserver) ? data.dns.dnsserver : [];
            const dns = dnsList[0] || '1.1.1.1';
            const pingStart = Date.now();
            
            fetch(`https://${dns}`, { mode: 'no-cors' })
                .then(() => {
                    innerWidget.querySelector('.ping').innerHTML = `<i class="fa fa-clock"></i> ${Date.now() - pingStart} ms`;
                })
                .catch(() => {
                    innerWidget.querySelector('.ping').innerHTML = `<i class="fa fa-clock"></i> timeout`;
                });

        } catch (error) {
            console.error(`pfSense fetch error (Widget ${this.index}):`, error);
            updateFail('.wan-ip');
            updateFail('.wanStatus');
            updateFail('.bandwidth');
            updateFail('.ping');
        }
    }
}

/**
 * Menedżer Sekcji i Kafelków (Tiles)
 */
class SectionManager {
    constructor(app) {
        this.app = app;
        this.hostDiv = document.getElementById('areaSections');
    }

    render() {
        if (!gSettings.sections) return;

        gSettings.sections.forEach(section => {
            if (section.disable) return;

            const secDiv = document.createElement('div');
            secDiv.className = 'col col-sm-6';
            this.hostDiv.appendChild(secDiv);
            
            const secTitle = document.createElement('div');
            secTitle.className = 'h6';
            
            if (section.info) {
                this.app.enableTooltips = true;
                secTitle.setAttribute("data-bs-toggle", "tooltip");
                secTitle.setAttribute("data-bs-placement", "bottom");
                secTitle.setAttribute("data-bs-title", section.info);
            }
            
            secTitle.innerHTML = `${section.name}<hr>`;
            secDiv.appendChild(secTitle);
            
            section.tiles?.forEach(tile => {
                if (tile.disable) return;

                // Kropka statusu
                const tileDot = document.createElement('span');
                tileDot.id = `dot${section.name}${tile.name}`;
                tileDot.className = 'dot';
                secDiv.appendChild(tileDot);
                
                // Link kafelka
                const tileLink = document.createElement('a');
                tileLink.id = `tile${section.name}${tile.name}`;
                tileLink.href = tile.url;
                tileLink.rel = 'noreferrer';
                tileLink.className = 'tile btn overflow-hidden';
                
                const openTab = tile.openTab || gSettings.page.openTab;
                if (openTab === 'new') tileLink.target = '_blank';

                if (tile.info) {
                    this.app.enableTooltips = true;
                    tileLink.setAttribute("data-bs-toggle", "tooltip");
                    tileLink.setAttribute("data-bs-placement", "bottom");
                    tileLink.setAttribute("data-bs-title", tile.info);
                }
                
                // Ikony
                let iconHtml = '';
                if (tile.faIcon) iconHtml = `<i class="${tile.faIcon} fa-fw" style="margin-right: 5px;"></i>`;
                else if (tile.icon) iconHtml = `<img src="${tile.icon}" width="20" class="${tile.icon}" style="margin-right: 5px;">`;
                else if (tile.svg) iconHtml = `<object data="${tile.svg}" width="15" class="${tile.svg}" style="margin-right: 5px;"></object>`;

                tileLink.innerHTML = `${iconHtml}${tile.name}`;
                secDiv.appendChild(tileLink);

                // Sprawdzanie statusu online
                if (!tile.disableCheck) {
                    this.checkOnline(tile.url, tileDot);
                } else {
                    tileDot.remove();
                }
            });
        });
    }

    async checkOnline(url, el) {
        try {
            const res = await fetch('include/checkOnline.php', {
                method: 'POST',
                body: new URLSearchParams({ url })
            });
            
            if (res.ok) {
                el.classList.add('dot-green');
                if (typeof currTheme !== 'undefined' && currTheme.colorOn) el.style.backgroundColor = currTheme.colorOn;
            } else {
                throw new Error('Server error');
            }
        } catch (e) {
            el.classList.remove('dot-green');
            if (typeof currTheme !== 'undefined' && currTheme.colorOf) el.style.backgroundColor = currTheme.colorOf;
            else el.style.backgroundColor = '#808080';
        }
    }
}

/**
 * Menedżer Uptime (Czasu działania)
 */
class UptimeManager {
    constructor() {
        this.url = gSettings.page.glances;
        this.baseTitle = gSettings.page.title;
    }

    async update() {
        if (!this.url) return;
        try {
            const response = await fetch(`${this.url}api/4/uptime`);
            let uptimeText = await response.text();
            
            const match = uptimeText.match(/(?:(\d+)\s+days?,\s+)?(\d+):(\d+):(\d+)/);
            if (match) {
                const days = parseInt(match[1]) || 0;
                const hours = parseInt(match[2]);
                const minutes = parseInt(match[3]);

                let dayText = "";
                if (days > 0) {
                    const label = (days === 1) ? "dzień" : "dni";
                    dayText = `${days} ${label}, `;
                }
                uptimeText = `${dayText}${hours} godz. ${minutes} min.`;
            }
            
            const fullTitle = `${this.baseTitle} (działa ${uptimeText})`;
            document.title = fullTitle;
            document.getElementById('pageTitle').innerHTML = fullTitle;
        } catch (error) {
            console.error("Uptime fetch error:", error);
        }
    }

    init() {
        if (this.url) {
            this.update();
            setInterval(() => this.update(), 60000);
        }
    }
}

/**
 * Główna klasa aplikacji (Dashboard)
 */
class DashboardApp {
    constructor() {
        this.enableTooltips = false;
        this.widgets = [];
    }

    init() {
        document.querySelector('.container').style.display = 'block';
        document.title = gSettings.page.title;
        document.getElementById('pageTitle').innerHTML = gSettings.page.title;

        // Inicjalizacja Uptime
        const uptimeManager = new UptimeManager();
        uptimeManager.init();

        // Inicjalizacja Widgetów
        if (gSettings.widgets && gSettings.widgets.length > 0) {
            document.getElementById('areaWidgets').style.display = 'flex';

            gSettings.widgets.forEach((widgetConfig, idx) => {
                if (widgetConfig.disable) return;

                let widgetInstance = null;
                switch (widgetConfig.type) {
                    case "cpu": widgetInstance = new CpuWidget(widgetConfig, idx, this); break;
                    case "memory": widgetInstance = new MemoryWidget(widgetConfig, idx, this); break;
                    case "zfs": widgetInstance = new ZfsWidget(widgetConfig, idx, this); break;
                    case "proxmox": widgetInstance = new ProxmoxWidget(widgetConfig, idx, this); break;
                    case "pfsense": widgetInstance = new PfsenseWidget(widgetConfig, idx, this); break;
                }

                if (widgetInstance) {
                    widgetInstance.init();
                    this.widgets.push(widgetInstance);
                }
            });
        }

        // Inicjalizacja Sekcji
        const sectionManager = new SectionManager(this);
        sectionManager.render();

        // Aplikowanie motywu
        if (typeof applyTheme === 'function') applyTheme();

        // Inicjalizacja Tooltipów
        if (this.enableTooltips && typeof bootstrap !== 'undefined') {
            const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
            [...tooltipTriggerList].forEach(el => new bootstrap.Tooltip(el));
        }
    }
}

// Uruchomienie aplikacji po załadowaniu DOM
document.addEventListener('DOMContentLoaded', () => {
    const app = new DashboardApp();
    app.init();
});
