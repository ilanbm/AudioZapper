
audibleCount = {} // windowId: count
currentTab = {} // windowId : tabId
returnTab = {} // windowId : tab

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

/////////////////////////

const playTabExclusively = ({tabId, windowId}) => {
	chrome.tabs.get(tabId, tab => returnTab[windowId] = tab)
	chrome.tabs.query({windowId, audible: true, pinned: false}, 
		audibleTabs => (
			audibleTabs.forEach( 
			tab => chrome.tabs.update(tab.id, {muted: tab.id != tabId})
			)
		)
	)
}

const nextAudible = (tabs, {windowId,index}) => [...tabs,...tabs].splice(index + 1,tabs.length).filter(tab => tab.audible)[0] || tabs[index]
const activateNextAudbile = tab => chrome.tabs.query({windowId: tab.windowId}, 
	tabs => chrome.tabs.update(nextAudible(tabs, tab).id,{active: true}))
const setReturnTabToNextAudible = windowId => chrome.tabs.query({windowId}, 
	tabs => returnTab[windowId] = nextAudible(tabs,returnTab[windowId]))

chrome.tabs.onUpdated.addListener( (tabId,changeInfo,{windowId,active}) => {
	changeInfo.status === 'loading' && updateWindowCount(windowId)
	if(changeInfo.audible !== undefined) {
		updateWindowCount(windowId)
		active && changeInfo.audible && playTabExclusively({tabId, windowId})
		!changeInfo.audible && returnTab[windowId] && tabId === returnTab[windowId].id && 
			setReturnTabToNextAudible(windowId);
	}
})

const onRemovedTab = (tabId,{windowId, oldWindowId}) => {
	windowId = windowId || oldWindowId
	updateWindowCount(windowId)
	returnTab[windowId] && returnTab[windowId].id === tabId && (returnTab[windowId]=undefined)
} 
chrome.tabs.onRemoved.addListener(onRemovedTab)
chrome.tabs.onDetached.addListener(onRemovedTab)
chrome.tabs.onCreated.addListener( tab => updateTabBadge(tab.id,tab.windowId))
chrome.tabs.onAttached.addListener( (tabId,{newWindowId}) => updateWindowCount(newWindowId))

chrome.tabs.onActivated.addListener(({tabId, windowId}) => {
		currentTab[windowId] = tabId
		chrome.tabs.get(tabId, tab => tab.audible && playTabExclusively({tabId,windowId}))
		updateTabBadge(tabId,windowId)
})

chrome.browserAction.onClicked.addListener(
	tab => (tab.audible || !returnTab[tab.windowId]) ? 
		activateNextAudbile(tab) : 
		chrome.tabs.update(returnTab[tab.windowId].id, {active: true})
)

// on extension load: 
chrome.tabs.query({},tabs => tabs.forEach(tab => chrome.tabs.update(tab.id, {muted: !tab.active})))
chrome.windows.getAll(windows => windows.forEach(window => updateWindowCount(window.id)))



