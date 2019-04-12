
chrome.tabs.onActivated.addListener( activeInfo => {
	chrome.windows.getAll({populate: true}, windowList => 
		windowList.forEach(window => 
			window.tabs.forEach( tab => 
				tab.audible && !tab.pinned && chrome.tabs.update(tab.id, {muted: true}) )
		)
	);
	chrome.tabs.getSelected(null, tab => chrome.tabs.update(tab.id, {muted: false}) );
})


