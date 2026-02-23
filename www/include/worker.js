//define global vars

let enableTooltips = false;

window.onload = function() {
    //show page contents at this point
    document.getElementsByClassName('container')[0].style = 'display:block;';

    //page settings
    document.title = gSettings.page.title;
    document.getElementById('pageTitle').innerHTML = gSettings.page.title;
    
    //create widgets
    if (gSettings.widgets.length > 0)
    {
	nCpu=0;
	nMemory=0;
	nProxmox=0;
	nPfsense=0;
	for (let n1 = 0; n1 < gSettings.widgets.length; n1++) {
	    if (gSettings.widgets[n1].disable) {
		//allows quickly disabling a widget
		continue;
	    }
	    document.getElementById('areaWidgets').style = 'display:flex;';
	    
	    // cpu
	    if(gSettings.widgets[n1].type === "cpu") {
		createWidgetCpu(n1);
		setInterval(refreshWidgetCpu, gSettings.widgets[n1].settings.refreshMs, n1, nCpu);
		refreshWidgetCpu(n1, nCpu);
		nCpu++;
	    }
	    // memory
	    if(gSettings.widgets[n1].type === "memory") {
		createWidgetMemory(n1);
		setInterval(refreshWidgetMemory, gSettings.widgets[n1].settings.refreshMs, n1, nMemory);
		refreshWidgetMemory(n1, nMemory);
		nMemory++;
	    }
	    //proxmox
	    if(gSettings.widgets[n1].type === "proxmox") {
		createWidgetProxmox(n1);
		setInterval(refreshWidgetProxmox, gSettings.widgets[n1].settings.refreshMs, n1, nProxmox);
		refreshWidgetProxmox(n1, nProxmox);
		nProxmox++;
	    }
	    //pfsense
	    if(gSettings.widgets[n1].type === "pfsense") {
		createWidgetPfsense(n1);
		setInterval(refreshWidgetPfsense, gSettings.widgets[n1].settings.refreshMs, n1, nPfsense);
		refreshWidgetPfsense(n1, nPfsense);
		nPfsense++;
	    }
	}
    }
    
    //create sections+tiles for services
    createSections();

    //apply theme now
    applyTheme();
    
    //check online status of all tiles
    for (let n1 = 0; n1 < gSettings.sections.length; n1++) {
	if (gSettings.sections[n1].disable) {
	    //allows quickly disabling a section
	    continue;
	}
	
	for (let n2 = 0; n2 < gSettings.sections[n1].tiles.length; n2++) {
	    if (gSettings.sections[n1].tiles[n2].disable) {
		//allows quickly disabling a tile
		continue;
	    }
	    
	    let thisUrl = gSettings.sections[n1].tiles[n2].url;
	    let thisDot = document.getElementById('dot' + gSettings.sections[n1].name + gSettings.sections[n1].tiles[n2].name)
	    
	    if (gSettings.sections[n1].tiles[n2].disableCheck) {
		//allows quickly disabling a tile online check
		thisDot.remove();
		continue;
	    }
	    
	    checkOnline(thisUrl, thisDot)
	}
    }
    
    //enable tooltips only if used anywhere
    if (enableTooltips === true) {
	const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
	const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));
    }
};


function createSections() {
    let hostDiv = document.getElementById('areaSections');
    for (let n1 = 0; n1 < gSettings.sections.length; n1++) {
	if (gSettings.sections[n1].disable) {
	    //allows quickly disabling a section
	    continue;
	}
	
	let thisSec = gSettings.sections[n1].name;

	let secDiv = document.createElement('div');
	
	secDiv.classList.add('col');
	secDiv.classList.add('col-sm-6');

	hostDiv.appendChild(secDiv);
	
	let secTitle = document.createElement('div');
	
	secTitle.classList.add('h6');
	
	//add tooltip to section
	if (gSettings.sections[n1].info) {
	    enableTooltips = true;
	    secTitle.setAttribute("data-bs-toggle", "tooltip");
	    secTitle.setAttribute("data-bs-placement", "bottom");
	    secTitle.setAttribute("data-bs-title", gSettings.sections[n1].info);
	}
	
	secTitle.innerHTML = thisSec + '<hr>';
	
	secDiv.appendChild(secTitle);
	
	//create tiles
	for (let n2 = 0; n2 < gSettings.sections[n1].tiles.length; n2++) {
	    if (gSettings.sections[n1].tiles[n2].disable) {
		//allows quickly disabling a tile
		continue;
	    }
	    let thisTile = gSettings.sections[n1].tiles[n2].name;

	    //add indicator dot
	    let tileDot = document.createElement('span');
	    tileDot.id = 'dot' + thisSec + thisTile;
	    tileDot.classList.add('dot');
	    
	    secDiv.appendChild(tileDot);
	    
	    
	    //add link to tile
	    let tileLink = document.createElement('a');
	    tileLink.id = 'tile' + thisSec + thisTile;
	    tileLink.href = gSettings.sections[n1].tiles[n2].url;
	    
	    //check if this tile has a different openTab setting, if not, use the page setting
	    let thisOpenTab;
	    if(gSettings.sections[n1].tiles[n2].openTab) {
		thisOpenTab = gSettings.sections[n1].tiles[n2].openTab;
	    } else {
		thisOpenTab = gSettings.page.openTab;
	    }
	    
	    tileLink.rel = 'noreferrer'

	    if (thisOpenTab === 'new') {
		tileLink.target = '_blank';
	    }
	    
	    tileLink.classList.add('tile');
	    tileLink.classList.add('btn');
	    tileLink.classList.add('overflow-hidden');

	    //add tooltip to tile
	    if (gSettings.sections[n1].tiles[n2].info) {
		enableTooltips = true;
		tileLink.setAttribute("data-bs-toggle", "tooltip");
		tileLink.setAttribute("data-bs-placement", "bottom");
		tileLink.setAttribute("data-bs-title", gSettings.sections[n1].tiles[n2].info);
	    }
	    
	    secDiv.appendChild(tileLink);
	    
	    //add fontawesome icon to tile
	    if (gSettings.sections[n1].tiles[n2].faIcon) {
		let tileIcon = document.createElement('i');
		tileIcon.id = 'icon' + thisSec + thisTile;
		tileIcon.className = gSettings.sections[n1].tiles[n2].faIcon;
		tileIcon.classList.add('fa-fw');
		tileIcon.style = 'margin-right: 5px;';
		
		tileLink.appendChild(tileIcon);
	    } else if (gSettings.sections[n1].tiles[n2].icon) {
		
		let tileIcon = document.createElement('img');
		tileIcon.id = 'iconImg' + thisSec + thisTile;
		tileIcon.src = gSettings.sections[n1].tiles[n2].icon;
		tileIcon.width = 20;
		tileIcon.className = gSettings.sections[n1].tiles[n2].icon;
		//tileIcon.classList.add('fa-fw');
		tileIcon.style = 'margin-right: 5px;';
		
		tileLink.appendChild(tileIcon);
	    }
	    else if (gSettings.sections[n1].tiles[n2].svg) {

		let tileIcon = document.createElement('object');
		tileIcon.id = 'iconObj' + thisSec + thisTile;
		tileIcon.data = gSettings.sections[n1].tiles[n2].svg;
		tileIcon.width = 15;
		tileIcon.className = gSettings.sections[n1].tiles[n2].svg;			
		tileIcon.style = 'margin-right: 5px;';
		
		tileLink.appendChild(tileIcon);

		//document.styleSheets[0].insertRule('.iconSVGObj { color: ${currTheme.colorPr}; }');
	    }
	    tileLink.innerHTML = tileLink.innerHTML + thisTile;
	}
    }
}

async function checkOnline(thisUrl, thisId) {
    //reads all tiles from settings and sets their respective indicators to green
    const options = {
	method: 'POST',
	body: new URLSearchParams({
	    url: thisUrl
	})
    };

    const response = await fetch('include/checkOnline.php', options);
    if (response.ok) {
	thisId.className = thisId.className.replace(/dot(?!\S)/g, 'dot dot-green');
	
	//this theming needs to be done here because js can't change style of future elements of a class
	$('.dot-green').css('background-color', currTheme.colorOn);
    } else {
	//console.log(thisUrl + ' : ' + response.status);
    }
}

//widget create functions
function createWidgetCpu(nW) {
    let hostDiv = document.getElementById('areaWidgets');
    
    let wgtDiv = document.createElement('div');
    
    wgtDiv.classList.add('col');
    wgtDiv.classList.add('col-sm-6');

    //add tooltip to widget
    if (gSettings.widgets[nW].info) {
	enableTooltips = true;
	wgtDiv.setAttribute("data-bs-toggle", "tooltip");
	wgtDiv.setAttribute("data-bs-placement", "bottom");
	wgtDiv.setAttribute("data-bs-title", gSettings.widgets[nW].info);
    }
    
    //add widget's name and hr under it only if name is specified
    wgtDiv.innerHTML = (gSettings.widgets[nW].name ? '<h7>' + gSettings.widgets[nW].name + '</h7><hr>' : '')
	+ '		<div class="widget widgetCpu text-end">'
    	+ '			<div class="row">'
	+ '				<span class="col-2"><i class="fa fa-microchip"></i></span>'
	+ '				<span class="col-7" id="cpuPrct' + nW + '"></span>'
	+ '			</div>'
	+ '			<div class="row">'
	+ '				<span class="col-2"><i class="fa fa-temperature-low"></i></span>'
	+ '				<span class="col-7" id="cpuTemp' + nW + '"></span>'
	+ '			</div>'
	+ '		</div>'
    
    hostDiv.appendChild(wgtDiv);
}

function createWidgetMemory(nW) {
    let hostDiv = document.getElementById('areaWidgets');
    
    let wgtDiv = document.createElement('div');
    
    wgtDiv.classList.add('col');
    wgtDiv.classList.add('col-sm-6');

    //add tooltip to widget
    if (gSettings.widgets[nW].info) {
	enableTooltips = true;
	wgtDiv.setAttribute("data-bs-toggle", "tooltip");
	wgtDiv.setAttribute("data-bs-placement", "bottom");
	wgtDiv.setAttribute("data-bs-title", gSettings.widgets[nW].info);
    }
    
    //add widget's name and hr under it only if name is specified
    wgtDiv.innerHTML = (gSettings.widgets[nW].name ? '<h7>' + gSettings.widgets[nW].name + '</h7><hr>' : '')
	+ '    <div class="widget widgetMemory text-end">'
        + '      <div class="row">'
	+ '        <span class="col-2"><i class="fa fa-memory"></i></span>'
	+ '        <span class="col-3">'
        + '          <div class="progress-container">'
        + '            <div class="progress-bar" style="width: 100%;"></div>'
        + '          </div>'
	+ '        </span>'
	+ '        <span class="col-7" id="memPrct' + nW + '"></span>'
        + '      </div>'
	+ '    </div>'
    
    hostDiv.appendChild(wgtDiv);
}


function createWidgetProxmox(nW) {
    let hostDiv = document.getElementById('areaWidgets');
    let wgtDiv = document.createElement('div');
    wgtDiv.classList.add('col');

    // Add tooltip to widget
    if (gSettings.widgets[nW].info) {
	enableTooltips = true;
	wgtDiv.setAttribute("data-bs-toggle", "tooltip");
	wgtDiv.setAttribute("data-bs-placement", "bottom");
	wgtDiv.setAttribute("data-bs-title", gSettings.widgets[nW].info);
    }

    // Add widget's name and <hr> under it only if name is specified
    wgtDiv.innerHTML = (gSettings.widgets[nW].name ? '<h7>' + gSettings.widgets[nW].name + '</h7><hr>' : '')
	+ '<div class="widget widgetProxmox">'
	+ '  <details closed>'
        + '     <summary class="d-flex">'
        + '        <span class="node-ressources">'
        + '           <span><i class="fa fa-microchip"></i> Loading...</span>'
        + '           <span><i class="fa fa-memory"></i> Loading...</span>'
        + '        </span>'
        + '     </summary>'
	+ '     <div class="vm-list">'
        + '        <i class="fa fa-server"></i> VMs & Containers Loading...'
	+ '     </div>'
        + '  </details>'
	+ '  <details closed>'
        + '     <summary class="d-flex">'
        + '        <span class="storage-summary">'
	+ '           <span><i class="fa fa-database"></i> Loading...</span>'
	+ '        </span>'
	+ '     </summary>'
        + '     <div class="storage-list"></div>'
        + '  </details>'
	+ '</div>';

    hostDiv.appendChild(wgtDiv);

    // Inject CSS
    const style = document.createElement('style');
    style.id = 'proxmox-widget-styles';
    style.textContent = `
		.bar-container, .dual-bar-container {
			background: #ddd;
			border-radius: 4px;
			height: 6px;
			margin: 4px 0 10px;
			position: relative;
			overflow: hidden;
		}
		.bar {
			height: 100%;
			position: absolute;
			top: 0;
			left: 0;
			transition: width 0.3s ease;
			opacity: 0.8;
		}
		.cpu-bar {
			background: linear-gradient(to right, #4caf50, #81c784);
		}
		.ram-bar {
			background: linear-gradient(to right, #2196f3, #64b5f6);
		}
	`;
    document.head.appendChild(style);
}

function createWidgetPfsense(nW) {
    let hostDiv = document.getElementById('areaWidgets');
    let wgtDiv = document.createElement('div');
    wgtDiv.classList.add('col');

    // Add tooltip to widget
    if (gSettings.widgets[nW].info) {
	enableTooltips = true;
	wgtDiv.setAttribute("data-bs-toggle", "tooltip");
	wgtDiv.setAttribute("data-bs-placement", "bottom");
	wgtDiv.setAttribute("data-bs-title", gSettings.widgets[nW].info);
    }

    // Add widget's name and <hr> under it only if name is specified
    wgtDiv.innerHTML = (gSettings.widgets[nW].name ? '<h7>' + gSettings.widgets[nW].name + '</h7><hr>' : '')
	+ '<div class="widget widgetPfsense">'
        + '  <div class="wan-ip"><i class="fa fa-globe"></i> Loading...</div>'
        + '  <div class="wanStatus"><i class="fa fa-signal"></i> Loading...</div>'
        + '  <div class="bandwidth"><i class="fa fa-gauge"></i> Loading...</div>'
        + '  <div class="ping"><i class="fa fa-clock"></i> Loading...</div>'
	+ '</div>';

    hostDiv.appendChild(wgtDiv);

    // Inject CSS
    const style = document.createElement('style');
    style.id = 'pfsense-widget-styles';
    style.textContent = `
	`;
    document.head.appendChild(style);
}


//widget refresh functions
function refreshWidgetCpu(nW, nW2) {
    $.getJSON({url: gSettings.widgets[nW].settings.url + 'api/4/quicklook'}).done(function (result, status, xhr) {
	document.getElementById('cpuPrct' + nW).innerText = result.cpu + '%'
    });
    
    $.getJSON({url: gSettings.widgets[nW].settings.url + 'api/4/sensors'}).done(function (result, status, xhr) {
        var temp = (result.length > 0 ? result.filter(function(o) { return o.label == "Package id 0" }).pop().value + 'C' : '-')
	document.getElementById('cpuTemp' + nW).innerText = temp
    });
}

function refreshWidgetMemory(nW, nW2) {
    $.getJSON({url: gSettings.widgets[nW].settings.url + 'api/4/quicklook'}).done(function (result, status, xhr) {
	document.getElementById('memPrct' + nW).innerText = result.mem + '%'
    });
}

function refreshWidgetProxmox(nW, nW2) {
    let widget = document.querySelectorAll('.widgetProxmox')[nW2];
    if (!widget) return;
    
    const options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            url: gSettings.widgets[nW].settings.url,
            token: gSettings.widgets[nW].settings.token,
            node: gSettings.widgets[nW].settings.node
        })
    };

    fetch('include/proxmox-widget.php', options)
	.then(response => response.json())
	.then(data => {
            if (
		typeof data !== 'object' ||
		    typeof data.node !== 'object' ||
		    !Array.isArray(data.qemu) ||
		    !Array.isArray(data.lxc) ||
		    !Array.isArray(data.storage)
	    ) {
		throw new Error("Invalid Proxmox API data format");
	    }

	    // NODE usage
            const nodeCPUUsedPercentage = data.node.cpu ? (parseFloat(data.node.cpu * 100).toFixed(2)) : "N/A";
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

            // VM/CT list
            let vmList = widget.querySelector('.vm-list');
            vmList.innerHTML = `
            <i class="fa fa-server"></i> VMs & Containers
			<ul class="vm-items"></ul>
        `;

            let vmContainerList = vmList.querySelector('.vm-items');
            const allVMs = [...data.qemu.map(vm => ({ ...vm, type: 'qemu' })), ...data.lxc.map(vm => ({ ...vm, type: 'lxc' }))];
            allVMs.sort((a, b) => a.vmid - b.vmid);
            allVMs.forEach(vm => {
		const vmCPUUsedPercentage = (vm.cpu * 100).toFixed(2);
		const vmMemoryUsedMB = (vm.mem / 1024 / 1024).toFixed(2);
		const vmMemoryMax = vm.maxmem || (32 * 1024 * 1024 * 1024); // fallback if not defined
		const vmMemoryUsedPercentage = ((vm.mem / vmMemoryMax) * 100).toFixed(2);
		const cpuFirst = parseFloat(vmCPUUsedPercentage) >= parseFloat(vmMemoryUsedPercentage);

		let li = document.createElement('li');
		li.innerHTML = `
                <strong>${vm.vmid} - ${vm.name}${vm.type === 'lxc' ? ' (LXC)' : ''}</strong>
                <span><i class="fa fa-microchip"></i> ${vmCPUUsedPercentage}%</span>
                <span><i class="fa fa-memory"></i> ${vmMemoryUsedMB} MB</span>
                <div class="dual-bar-container">
                    <div class="bar cpu-bar" style="width: ${vmCPUUsedPercentage}%; z-index: ${cpuFirst ? 1 : 2};"></div>
            		<div class="bar ram-bar" style="width: ${vmMemoryUsedPercentage}%; z-index: ${cpuFirst ? 2 : 1};"></div>
                </div>
            `;
		vmContainerList.appendChild(li);
            });

	    // STORAGE list
	    let storageList = widget.querySelector('.storage-list');
	    storageList.innerHTML = `
			<ul class="storage-items"></ul>
		`;

	    let storageUsedGB = 0
	    let storageTotalGB = 0
            let storageUsedPercentage = 0

	    let storageItems = storageList.querySelector('.storage-items');
	    data.storage.sort((a, b) => a.storage.localeCompare(b.storage));
	    data.storage.forEach(storageItem => {
		let storageItemUsedGB = (storageItem.used / 1024 / 1024 / 1024);
		let storageItemTotalGB = (storageItem.total / 1024 / 1024 / 1024);
		let storageItemUsedPercentage = (storageItem.used_fraction * 100);
		storageUsedGB = (storageUsedGB + storageItemUsedGB)
		storageTotalGB = (storageTotalGB + storageItemTotalGB)
		storageUsedPercentage = (storageUsedGB / storageTotalGB * 100);
		let li = document.createElement('li');
		li.innerHTML = `
				<span class="col-2"><i class="fa fa-hdd"></i></span> ${storageItem.storage} - ${storageItemUsedGB.toFixed(2)} GB (${storageItemUsedPercentage.toFixed(2)}%)
				<div class="bar-container"><div class="bar" style="width: ${storageItemUsedPercentage}%; background: linear-gradient(to right, #9c27b0, #ce93d8);"></div></div>
			`;
		storageItems.appendChild(li);
	    });

	    widget.querySelector('.storage-summary').innerHTML = `
		 <i class="fa fa-database"></i> ${storageUsedGB.toFixed(2)} GB (${storageUsedPercentage.toFixed(2)}%)
		 <div class="bar-container"><div class="bar" style="width: ${storageUsedPercentage}%; background: linear-gradient(to right, #9c27b0, #ce93d8);"></div></div>
	`;
	})
	.catch(error => {
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
	});	
}

function refreshWidgetPfsense(nW, nW2) {
    let widget = document.querySelectorAll('.widgetPfsense')[nW2];
    if (!widget) return;
    
    const options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            url: gSettings.widgets[nW].settings.url,
            xapikey: gSettings.widgets[nW].settings.xapikey
        })
    };

    fetch('include/pfsense-widget.php', options)
	.then(response => response.json())
	.then(data => {
            if (!data || !data.dns || !data.interfaceStatus) {
		throw new Error("Invalid pfSense API data format");
            }

	    // WAN status
            const interfaceList = Array.isArray(data.interfaceStatus) ? data.interfaceStatus : [];
            const wanInterface = interfaceList.find(interface => interface.descr === "WAN") || {};
            const wanIP = wanInterface.ipaddr ?? "N/A";
            const wanStatus = wanInterface.status ?? "N/A";

	    widget.querySelector('.wan-ip').innerHTML = `
            <i class="fa fa-globe"></i> ${wanIP}
		`;

	    widget.querySelector('.wanStatus').innerHTML = `
            <i class="fa fa-signal"></i> ${wanStatus}
		`;
	    
	    // Bandwidth
            const now = Date.now();
            const secondsSinceLast = (now - (widget._lastUpdateTime || now)) / 1000;

            const lastIn = widget._lastInBytes || wanInterface.inbytes;
            const lastOut = widget._lastOutBytes || wanInterface.outbytes;

            const deltaIn = wanInterface.inbytes - lastIn;
            const deltaOut = wanInterface.outbytes - lastOut;

            const wanBandwidthIn = (deltaIn * 8 / 1024 / 1024 / secondsSinceLast).toFixed(2);
            const wanBandwidthOut = (deltaOut * 8 / 1024 / 1024 / secondsSinceLast).toFixed(2);

	    widget.querySelector('.bandwidth').innerHTML = `
            <i class="fa fa-gauge"></i> ${wanBandwidthIn} / ${wanBandwidthOut} Mbit/s
        `;

	    // Save current bandwith for next refresh
	    widget._lastInBytes = wanInterface.inbytes;
	    widget._lastOutBytes = wanInterface.outbytes;
	    widget._lastUpdateTime = now;

	    // DNS ping
	    const dnsList = Array.isArray(data.dns?.dnsserver) ? data.dns.dnsserver : [];
	    const dns = dnsList[0] || '1.1.1.1';
	    const pingStart = Date.now();
	    
	    fetch("https://" + dns, { mode: 'no-cors' })
		.then(() => {
		    const ping = Date.now() - pingStart;
		    widget.querySelector('.ping').innerHTML =
		        `<i class="fa fa-clock"></i> ${ping} ms`;
		})
		.catch(() => {
		    widget.querySelector('.ping').innerHTML =
		        `<i class="fa fa-clock"></i> timeout`;
		});

	})
	.catch(error => {
	    console.error("pfSense fetch error:", error);
	    const fail = sel => {
		const el = widget.querySelector(sel);
		if (el) el.innerHTML = `<span class="text-danger">error</span>`;
	    };
	    fail('.wan-ip');
	    fail('.wanStatus');
	    fail('.bandwidth');
	    fail('.ping');
	    fail('.speedtest');
	});		
}
