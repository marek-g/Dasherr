// Zmienne globalne i zbiór załadowanych stylów (aby unikać duplikatów CSS)
let enableTooltips = false;
const injectedStyles = new Set();

// --- FUNKCJE POMOCNICZE ---

// Ładuje style CSS tylko raz dla całego dokumentu
function injectStyleOnce(id, css) {
    if (!injectedStyles.has(id)) {
        const style = document.createElement('style');
        style.id = id;
        style.textContent = css;
        document.head.appendChild(style);
        injectedStyles.add(id);
    }
}

// Tworzy wspólną ramkę (kontener) dla każdego widgetu
function createWidgetContainer(nW, innerHTMLContent) {
    const hostDiv = document.getElementById('areaWidgets');
    const wgtDiv = document.createElement('div');
    wgtDiv.className = 'col col-sm-6';
    const widgetConf = gSettings.widgets[nW];

    if (widgetConf.info) {
        enableTooltips = true;
        wgtDiv.setAttribute("data-bs-toggle", "tooltip");
        wgtDiv.setAttribute("data-bs-placement", "bottom");
        wgtDiv.setAttribute("data-bs-title", widgetConf.info);
    }

    const titleHtml = widgetConf.name ? `<h7>${widgetConf.name}</h7><hr>` : '';
    wgtDiv.innerHTML = `${titleHtml}${innerHTMLContent}`;
    
    hostDiv.appendChild(wgtDiv);
}

// --- INICJALIZACJA STRONY ---

document.addEventListener('DOMContentLoaded', () => {
    // Pokaż zawartość
    document.querySelector('.container').style.display = 'block';

    // Tytuł strony
    document.title = gSettings.page.title;
    document.getElementById('pageTitle').innerHTML = gSettings.page.title;
	if (gSettings.page.glances) {
		updatePageUptime();
		setInterval(updatePageUptime, 60000); // Odświeżaj uptime co minutę
	}
    
    // Tworzenie widgetów
    if (gSettings.widgets && gSettings.widgets.length > 0) {
        document.getElementById('areaWidgets').style.display = 'flex';
        
        // Liczniki dla konkretnych typów widgetów
        let counters = { cpu: 0, memory: 0, proxmox: 0, pfsense: 0 };

        gSettings.widgets.forEach((widget, idx) => {
            if (widget.disable) return; // Szybkie wyłączanie widgetu
            
            const refreshMs = widget.settings.refreshMs;

            switch (widget.type) {
            case "cpu":
                createWidgetCpu(idx);
                setInterval(refreshWidgetCpu, refreshMs, idx, counters.cpu);
                refreshWidgetCpu(idx, counters.cpu);
                counters.cpu++;
                break;
            case "memory":
                createWidgetMemory(idx);
                setInterval(refreshWidgetMemory, refreshMs, idx, counters.memory);
                refreshWidgetMemory(idx, counters.memory);
                counters.memory++;
                break;
			case "zfs":
				createWidgetZfs(idx);
				setInterval(refreshWidgetZfs, refreshMs, idx);
				refreshWidgetZfs(idx);
				break;
            case "proxmox":
                createWidgetProxmox(idx);
                setInterval(refreshWidgetProxmox, refreshMs, idx, counters.proxmox);
                refreshWidgetProxmox(idx, counters.proxmox);
                counters.proxmox++;
                break;
            case "pfsense":
                createWidgetPfsense(idx);
                setInterval(refreshWidgetPfsense, refreshMs, idx, counters.pfsense);
                refreshWidgetPfsense(idx, counters.pfsense);
                counters.pfsense++;
                break;
            }
        });
    }
    
    // Utworzenie sekcji i kafelków
    createSections();

    // Aplikowanie motywu (zakładamy, że funkcja jest zdefiniowana w innej części projektu)
    if (typeof applyTheme === 'function') applyTheme();
    
    // Sprawdzanie statusu online
    gSettings.sections?.forEach(section => {
        if (section.disable) return;

        section.tiles?.forEach(tile => {
            if (tile.disable) return;
            
            const thisDot = document.getElementById(`dot${section.name}${tile.name}`);
            if (!thisDot) return;
            
            if (tile.disableCheck) {
                thisDot.remove();
                return;
            }
            
            checkOnline(tile.url, thisDot);
        });
    });
    
    // Inicjalizacja Bootstrap Tooltips
    if (enableTooltips && typeof bootstrap !== 'undefined') {
        const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
        [...tooltipTriggerList].forEach(el => new bootstrap.Tooltip(el));
    }
});

// --- ODŚWIEŻANIE ELEMENTÓW POZA KAFELKAMI ---

async function updatePageUptime() {
    const url = gSettings.page.glances;
    if (!url) return;

    try {
        const response = await fetch(`${url}api/4/uptime`);
        let uptimeText = await response.text(); // API Glances zwraca uptime jako prosty string
        
        const baseTitle = gSettings.page.title;

		// Czyszczenie cudzysłowów i tłumaczenie
        uptimeText = uptimeText.replace(/"/g, '');
        uptimeText = uptimeText.replace(/days/g, 'dni');
        uptimeText = uptimeText.replace(/day/g, 'dzień');
        
        const fullTitle = `${baseTitle} (działa ${uptimeText})`;
        document.title = fullTitle;
        document.getElementById('pageTitle').innerHTML = fullTitle;
    } catch (error) {
        console.error("Uptime fetch error:", error);
    }
}

// --- GENEROWANIE SEKCJI I KAFELKÓW ---

function createSections() {
    const hostDiv = document.getElementById('areaSections');
    if (!gSettings.sections) return;

    gSettings.sections.forEach(section => {
        if (section.disable) return;

        const secDiv = document.createElement('div');
        secDiv.className = 'col col-sm-6';
        hostDiv.appendChild(secDiv);
        
        const secTitle = document.createElement('div');
        secTitle.className = 'h6';
        
        if (section.info) {
            enableTooltips = true;
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
                enableTooltips = true;
                tileLink.setAttribute("data-bs-toggle", "tooltip");
                tileLink.setAttribute("data-bs-placement", "bottom");
                tileLink.setAttribute("data-bs-title", tile.info);
            }
            
            // Dodawanie ikony w oparciu o typ
            let iconHtml = '';
            if (tile.faIcon) {
                iconHtml = `<i id="icon${section.name}${tile.name}" class="${tile.faIcon} fa-fw" style="margin-right: 5px;"></i>`;
            } else if (tile.icon) {
                iconHtml = `<img id="iconImg${section.name}${tile.name}" src="${tile.icon}" width="20" class="${tile.icon}" style="margin-right: 5px;">`;
            } else if (tile.svg) {
                iconHtml = `<object id="iconObj${section.name}${tile.name}" data="${tile.svg}" width="15" class="${tile.svg}" style="margin-right: 5px;"></object>`;
            }

            tileLink.innerHTML = `${iconHtml}${tile.name}`;
            secDiv.appendChild(tileLink);
        });
    });
}

async function checkOnline(url, el) {
    try {
        const res = await fetch('include/checkOnline.php', {
            method: 'POST',
            body: new URLSearchParams({ url })
        });
        
        if (res.ok) {
            // SERWER ONLINE
            el.classList.add('dot-green');
            if (typeof currTheme !== 'undefined' && currTheme.colorOn) {
                el.style.backgroundColor = currTheme.colorOn;
            }
        } else {
            // SERWER ODPOWIADA BŁĘDEM (np. 500)
            throw new Error('Server error');
        }
    } catch (e) {
        // SERWER OFFLINE (timeout, 404, błąd sieci)
        el.classList.remove('dot-green'); // Usuwamy zieloną klasę
        
        // Przywracamy kolor "Offline" z motywu
        if (typeof currTheme !== 'undefined' && currTheme.colorOf) {
            el.style.backgroundColor = currTheme.colorOf;
        } else {
            el.style.backgroundColor = '#808080'; // Fallback szary
        }
    }
}

// --- FUNKCJE TWORZĄCE WIDGETY ---

function createWidgetCpu(nW) {
    const content = `
        <div class="widget widgetCpu">
            <div class="d-flex align-items-center mb-2" style="gap: 10px;">
                <i class="fa fa-microchip" style="width: 20px; text-align: center;"></i>
                <div class="progress-container" style="flex: 1; margin: 0;">
                    <div id="cpuBar${nW}" class="progress-bar" style="width: 0%;"></div>
                </div>
                <span id="cpuPrct${nW}" class="text-end" style="min-width: 45px; font-family: monospace;">0%</span>
            </div>

            <div class="d-flex align-items-center" style="gap: 10px;">
                <i class="fa fa-temperature-low" style="width: 20px; text-align: center;"></i>
                <div class="progress-container" style="flex: 1; margin: 0;">
                    <div id="tempBar${nW}" class="progress-bar" style="width: 0%; background-color: #ffc107;"></div>
                </div>
                <span id="cpuTemp${nW}" class="text-end" style="min-width: 45px; font-family: monospace;">-</span>
            </div>
        </div>`;
    createWidgetContainer(nW, content);
}

function createWidgetMemory(nW) {
    const content = `
        <div class="widget widgetMemory">
            <div class="d-flex align-items-center" style="gap: 10px;">
                <i class="fa fa-memory" style="width: 20px; text-align: center;"></i>
                <div class="progress-container" style="flex: 1; margin: 0;">
                    <div id="memBar${nW}" class="progress-bar" style="width: 0%;"></div>
                </div>
                <span id="memPrct${nW}" class="text-end" style="min-width: 45px; font-family: monospace;">0%</span>
            </div>
        </div>`;
    createWidgetContainer(nW, content);
}

function createWidgetZfs(nW) {
    const settings = gSettings.widgets[nW].settings;
    const datasets = settings.datasets || []; // Teraz to tablica obiektów
    
    let rowsHtml = '';
    
    datasets.forEach((dsConfig, i) => {
        const dsName = dsConfig.name;
        // użyj label z konfiguracji, a jeśli go nie ma - skróć nazwę systemową
        const displayLabel = dsConfig.label || (dsName.includes('/') ? dsName.split('/').pop() : dsName);

		// wybór ikony na podstawie nowej flagi isSum
		const iconClass = dsConfig.isSum === true ? 'fa-layer-group' : 'fa-hdd';
		const labelColor = dsConfig.isSum ? '#ffc107' : 'inherit'; // Złoty dla sumy, domyślny dla reszty
		
        rowsHtml += `
            <div class="d-flex align-items-center ${i < datasets.length - 1 ? 'mb-2' : ''}" style="gap: 10px;">
                <i class="fa ${iconClass}" style="width: 15px; text-align: center; color: ${labelColor};"></i>
                <span class="text-start text-truncate" style="width: 80px; font-size: 0.75rem; font-weight: bold; color: ${labelColor};" title="${dsName}">
                    ${displayLabel}
                </span>
                <div class="progress-container" style="flex: 1; margin: 0;">
                    <div id="zfsBar${nW}_${i}" class="progress-bar" style="width: 0%; background-color: #0dcaf0;"></div>
                </div>
                <span id="zfsText${nW}_${i}" class="text-end" style="min-width: 110px; font-family: monospace; font-size: 0.8rem; color: ${labelColor};">
                    ...
                </span>
            </div>`;
    });

    const content = `<div class="widget widgetZfs">${rowsHtml}</div>`;
    createWidgetContainer(nW, content);
}

function createWidgetProxmox(nW) {
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

    injectStyleOnce('proxmox-widget-styles', `
        .bar-container, .dual-bar-container { background: #ddd; border-radius: 4px; height: 6px; margin: 4px 0 10px; position: relative; overflow: hidden; }
        .bar { height: 100%; position: absolute; top: 0; left: 0; transition: width 0.3s ease; opacity: 0.8; }
        .cpu-bar { background: linear-gradient(to right, #4caf50, #81c784); }
        .ram-bar { background: linear-gradient(to right, #2196f3, #64b5f6); }
    `);

    createWidgetContainer(nW, content);
}

function createWidgetPfsense(nW) {
    const content = `
        <div class="widget widgetPfsense">
            <div class="wan-ip"><i class="fa fa-globe"></i> Loading...</div>
            <div class="wanStatus"><i class="fa fa-signal"></i> Loading...</div>
            <div class="bandwidth"><i class="fa fa-gauge"></i> Loading...</div>
            <div class="ping"><i class="fa fa-clock"></i> Loading...</div>
        </div>`;
    createWidgetContainer(nW, content);
}

// --- FUNKCJE ODŚWIEŻAJĄCE WIDGETY ---

async function refreshWidgetCpu(nW, nW2) {
    const url = gSettings.widgets[nW].settings.url || gSettings.page.glances;
    try {
        const [quicklookRes, sensorsRes] = await Promise.all([
            fetch(`${url}api/4/quicklook`).then(res => res.json()),
            fetch(`${url}api/4/sensors`).then(res => res.json())
        ]);

        // Aktualizacja CPU
        const cpuUsage = quicklookRes.cpu;

		const barEl = document.getElementById(`cpuBar${nW}`);
        if (barEl) barEl.style.width = `${cpuUsage}%`;

		const textEl = document.getElementById(`cpuPrct${nW}`);
        if (textEl) {
            textEl.innerText = `${cpuUsage}%`;

			// alarm powyżej 90%, ostrzeżenie powyżej 70%
			textEl.classList.remove('text-warning-bold');
			textEl.classList.remove('text-danger-bold');
            if (cpuUsage >= 90) {
                textEl.classList.add('text-danger-bold');
            } else if (cpuUsage >= 70) {
				textEl.classList.add('text-warning-bold');
			}
        }
        
        // Aktualizacja temperatury
        const pkgSensor = sensorsRes.find(o => o.label === "Package id 0");
		const cpuTemp = pkgSensor ? pkgSensor.value : 0;

		const tempBarEl = document.getElementById(`tempBar${nW}`);
		if (tempBarEl) {
            // Zakładamy 1:1 (stopnie na procenty)
            tempBarEl.style.width = `${Math.min(cpuTemp, 100)}%`;

			// alarm powyżej 90%, ostrzeżenie powyżej 70%
			tempBarEl.classList.remove('text-warning-bold');
			tempBarEl.classList.remove('text-danger-bold');
            if (cpuTemp >= 90) {
                tempBarEl.classList.add('text-danger-bold');
            } else if (cpuTemp >= 70) {
				tempBarEl.classList.add('text-warning-bold');
			}
        }
		
        document.getElementById(`cpuTemp${nW}`).innerText = pkgSensor ? `${pkgSensor.value}°C` : '-';
    } catch (error) {
        console.error("CPU fetch error:", error);
    }
}

async function refreshWidgetMemory(nW) {
    const url = gSettings.widgets[nW].settings.url || gSettings.page.glances;
    try {
        const res = await fetch(`${url}api/4/quicklook`).then(r => r.json());
        const usage = res.mem;

		// aktualizacja tekstu
		const textEl = document.getElementById(`memPrct${nW}`);
        if (textEl) {
            textEl.innerText = `${usage}%`;
            // alarm powyżej 90%, ostrzeżenie powyżej 70%
			textEl.classList.remove('text-warning-bold');
			textEl.classList.remove('text-danger-bold');
            if (usage >= 90) {
                textEl.classList.add('text-danger-bold');
            } else if (usage >= 70) {
				textEl.classList.add('text-warning-bold');
			}
        }

		// aktualizacja paska postępu
		const barEl = document.getElementById(`memBar${nW}`);
        if (barEl) barEl.style.width = `${usage}%`;
    } catch (error) {
        console.error("Memory fetch error:", error);
    }
}

async function refreshWidgetZfs(nW) {
    const settings = gSettings.widgets[nW].settings;
    const datasetsConfig = settings.datasets || [];
    
    try {
        const response = await fetch('include/zfs-data.php');
        const allData = await response.json();
        
        if (allData.error) throw new Error(allData.error);

        datasetsConfig.forEach((dsConfig, i) => {
            const ds = allData.find(item => item.name === dsConfig.name);
            const barEl = document.getElementById(`zfsBar${nW}_${i}`);
            const textEl = document.getElementById(`zfsText${nW}_${i}`);

            if (ds && barEl && textEl) {
                const totalBytes = ds.used + ds.avail;
                const usedGB = (ds.used / 1073741824).toFixed(1);
                const totalGB = (totalBytes / 1073741824).toFixed(1);
                const usagePct = ((ds.used / totalBytes) * 100).toFixed(1);

                // --- Aktualizacja wizualna paska ---
                barEl.style.width = `${usagePct}%`;
                barEl.style.backgroundColor = usagePct >= 90 ? '#dc3545' : '#0dcaf0';

                // --- Logika tekstu sterowana niezależnie ---
                // Sprawdzamy dsConfig (indywidualne ustawienie), jeśli brak - domyślnie true
                const individualShowTotal = dsConfig.showTotal !== false;

                if (individualShowTotal) {
                    textEl.innerHTML = `${usedGB} / ${totalGB} GB`;
                } else {
                    textEl.innerHTML = `${usedGB} GB`;
                }

                // --- Alarm kolorystyczny ---
                usagePct >= 90 ? textEl.classList.add('text-danger-bold') : textEl.classList.remove('text-danger-bold');
            }
        });
    } catch (error) {
        console.error("ZFS fetch error:", error);
    }
}

async function refreshWidgetProxmox(nW, nW2) {
    const widget = document.querySelectorAll('.widgetProxmox')[nW2];
    if (!widget) return;
    
    const settings = gSettings.widgets[nW].settings;
    const options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: settings.url, token: settings.token, node: settings.node })
    };

    try {
        const response = await fetch('include/proxmox-widget.php', options);
        const data = await response.json();

        if (typeof data !== 'object' || typeof data.node !== 'object' || !Array.isArray(data.qemu) || !Array.isArray(data.lxc) || !Array.isArray(data.storage)) {
            throw new Error("Invalid Proxmox API data format");
        }

        // --- Użycie Węzła (Node) ---
        const nodeCPUUsedPercentage = data.node.cpu ? (data.node.cpu * 100).toFixed(2) : "N/A";
        const nodeMemoryUsedMB = data.node.memory ? parseInt(data.node.memory.used / 1024 / 1024, 10) : "N/A";
        const nodeMemoryUsedPercentage = data.node.memory ? (data.node.memory.used / data.node.memory.total * 100).toFixed(2) : 0;
        const cpuFirst = parseFloat(nodeCPUUsedPercentage) >= parseFloat(nodeMemoryUsedPercentage);

        widget.querySelector('.node-ressources').innerHTML = `
            <span><i class="fa fa-microchip"></i> ${nodeCPUUsedPercentage}%</span>
            <span><i class="fa fa-memory"></i> ${nodeMemoryUsedMB} MB</span>
            <div class="dual-bar-container">
                <div class="bar cpu-bar" style="width: ${nodeCPUUsedPercentage}%; z-index: ${cpuFirst ? 1 : 2};"></div>
                <div class="bar ram-bar" style="width: ${nodeMemoryUsedPercentage}%; z-index: ${cpuFirst ? 2 : 1};"></div>
            </div>
        `;

        // --- Lista VM/CT ---
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

        widget.querySelector('.vm-list').innerHTML = `<i class="fa fa-server"></i> VMs & Containers<ul class="vm-items">${vmsHtml}</ul>`;

        // --- Pamięć Masowa (Storage) ---
        let storageUsedGB = 0;
        let storageTotalGB = 0;

        const storageSorted = [...data.storage].sort((a, b) => a.storage.localeCompare(b.storage));
        const storageHtml = storageSorted.map(item => {
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

        widget.querySelector('.storage-list').innerHTML = `<ul class="storage-items">${storageHtml}</ul>`;

        const totalStorageUsedPercentage = storageTotalGB > 0 ? (storageUsedGB / storageTotalGB * 100) : 0;
        widget.querySelector('.storage-summary').innerHTML = `
             <i class="fa fa-database"></i> ${storageUsedGB.toFixed(2)} GB (${totalStorageUsedPercentage.toFixed(2)}%)
             <div class="bar-container"><div class="bar" style="width: ${totalStorageUsedPercentage}%; background: linear-gradient(to right, #9c27b0, #ce93d8);"></div></div>
        `;
        
    } catch (error) {
        console.error("Proxmox fetch error:", error);
        const fail = (sel, fallback = 'error') => {
            const el = widget.querySelector(sel);
            if (el) el.innerHTML = `<span class="text-danger">${fallback}</span>`;
        };
        fail('.node-ressources');
        fail('.vm-list', 'VMs unavailable');
        fail('.storage-summary');
        const storageList = widget.querySelector('.storage-list');
        if (storageList) storageList.innerHTML = '';
    }
}

async function refreshWidgetPfsense(nW, nW2) {
    const widget = document.querySelectorAll('.widgetPfsense')[nW2];
    if (!widget) return;
    
    const settings = gSettings.widgets[nW].settings;
    const options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: settings.url, xapikey: settings.xapikey })
    };

    try {
        const response = await fetch('include/pfsense-widget.php', options);
        const data = await response.json();

        if (!data || !data.dns || !data.interfaceStatus) {
            throw new Error("Invalid pfSense API data format");
        }

        const interfaceList = Array.isArray(data.interfaceStatus) ? data.interfaceStatus : [];
        const wanInterface = interfaceList.find(i => i.descr === "WAN") || {};
        
        widget.querySelector('.wan-ip').innerHTML = `<i class="fa fa-globe"></i> ${wanInterface.ipaddr ?? "N/A"}`;
        widget.querySelector('.wanStatus').innerHTML = `<i class="fa fa-signal"></i> ${wanInterface.status ?? "N/A"}`;
        
        // --- Przepustowość (Bandwidth) ---
        const now = Date.now();
        const secondsSinceLast = (now - (widget._lastUpdateTime || now)) / 1000;

        const lastIn = widget._lastInBytes || wanInterface.inbytes;
        const lastOut = widget._lastOutBytes || wanInterface.outbytes;

        const wanBandwidthIn = ((wanInterface.inbytes - lastIn) * 8 / 1024 / 1024 / (secondsSinceLast || 1)).toFixed(2);
        const wanBandwidthOut = ((wanInterface.outbytes - lastOut) * 8 / 1024 / 1024 / (secondsSinceLast || 1)).toFixed(2);

        widget.querySelector('.bandwidth').innerHTML = `<i class="fa fa-gauge"></i> ${wanBandwidthIn} / ${wanBandwidthOut} Mbit/s`;

        // Zapis stanu do kolejnego odświeżenia
        widget._lastInBytes = wanInterface.inbytes;
        widget._lastOutBytes = wanInterface.outbytes;
        widget._lastUpdateTime = now;

        // --- DNS Ping ---
        const dnsList = Array.isArray(data.dns?.dnsserver) ? data.dns.dnsserver : [];
        const dns = dnsList[0] || '1.1.1.1';
        const pingStart = Date.now();
        
        fetch(`https://${dns}`, { mode: 'no-cors' })
            .then(() => {
                widget.querySelector('.ping').innerHTML = `<i class="fa fa-clock"></i> ${Date.now() - pingStart} ms`;
            })
            .catch(() => {
                widget.querySelector('.ping').innerHTML = `<i class="fa fa-clock"></i> timeout`;
            });

    } catch (error) {
        console.error("pfSense fetch error:", error);
        const fail = sel => {
            const el = widget.querySelector(sel);
            if (el) el.innerHTML = `<span class="text-danger">error</span>`;
        };
        fail('.wan-ip');
        fail('.wanStatus');
        fail('.bandwidth');
        fail('.ping');
    }
}
