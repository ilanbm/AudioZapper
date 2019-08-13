
chrome.tabs.onActivated.addListener( activeInfo => {
	chrome.windows.getCurrent({populate: true}, window => window.tabs.forEach( tab => 
				tab.audible && !tab.pinned && chrome.tabs.update(tab.id, {muted: true}) ))
	chrome.tabs.getSelected(null, tab => chrome.tabs.update(tab.id, {muted: false}) );
})


