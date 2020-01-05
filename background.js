
audibleCount = {} // windowId: count
currentTab = {} // windowId : tabId

const animateIcon = windowId => {
	const min = 0, max = 38;
	var current = min;
	const loopAnimate = () => {
		if (audibleCount[windowId]) {
			chrome.browserAction.setIcon({path:`icon/frame_${(current < 10 ? '0' : '') + current}_delay-0.03s.png`, tabId: currentTab[windowId]},
			()=>{
				current = current + 7
				current > max && (current = current % max)
				window.setTimeout(loopAnimate, 90);
			})
		}
		else {
			chrome.browserAction.setIcon({path:`icon/frame_08_delay-0.03s.png`, tabId: currentTab[windowId]})
		}
	}
	loopAnimate()
}

const updateTabBadge = (tabId,windowId) => {
		const blue = '#3E71E1'
		const count = audibleCount[windowId]
		chrome.browserAction.setIcon({path:`icon/frame_08_delay-0.03s.png`, tabId})
		chrome.browserAction.setBadgeText({tabId, text: count > 1 ? count + '' : ''})
		chrome.browserAction.setBadgeBackgroundColor({color: blue, tabId})
}

const updateWindowCount = windowId => 
	chrome.tabs.query({windowId}, tabs => {
				prevCount = audibleCount[windowId]
				audibleCount[windowId] = tabs.filter(t=>t.audible).length
				!prevCount && audibleCount[windowId] && animateIcon(windowId)
				updateTabBadge(currentTab[windowId],windowId)
		})

const zapTab = ({tabId, windowId}) => 
	chrome.tabs.query({windowId, audible: true, pinned: false}, 
		audibleTabs => (
			audibleTabs.forEach( 
			tab => chrome.tabs.update(tab.id, {muted: tab.id != tabId})
			)
		)
)

chrome.tabs.onUpdated.addListener( (tabId,changeInfo,tab) => {
	(changeInfo.status === 'loading' || changeInfo.audible !== undefined) && updateWindowCount(tab.windowId);
	(changeInfo.audible == true) && tab.active && zapTab({tabId, windowId: tab.windowId});
})
chrome.tabs.onRemoved.addListener( (tabId,{windowId}) => updateWindowCount(windowId) )
chrome.tabs.onCreated.addListener( tab => updateTabBadge(tab.id,tab.windowId))
chrome.tabs.onActivated.addListener(({tabId, windowId}) => {
		currentTab[windowId] = tabId
		zapTab({tabId,windowId})
		updateTabBadge(tabId,windowId)
})

chrome.browserAction.onClicked.addListener(
	activeTab => 
		chrome.tabs.query({windowId:activeTab.windowId},
			tabs=>
				chrome.tabs.update(([...tabs.splice(activeTab.index + 1),...tabs.splice(0,activeTab.index + 1)].filter(	
					tab => tab.audible)[0] || activeTab).id,{active: true}
				)
		)
)

// on extension load: 
chrome.tabs.query({},tabs => tabs.forEach(tab => chrome.tabs.update(tab.id, {muted: !tab.active})))
chrome.windows.getAll(windows => windows.forEach(window => updateWindowCount(window.id)))



