var MiniBrowser = function(dictionary) 
{
	this.url = dictionary.url;
	this.backgroundColor = (dictionary.backgroundColor != "undefined") ? dictionary.backgroundColor : '#FFF';
	this.barColor = (dictionary.barColor != "undefined") ? dictionary.barColor : Ti.UI.currentWindow.barColor;
	this.modal = (dictionary.modal != "undefined") ? dictionary.modal : false;
	this.showToolbar = (dictionary.showToolbar != "undefined" && typeof dictionary.showToolbar === 'boolean') ? dictionary.showToolbar : true;
	this.html = (dictionary.html != 'undefined') ? dictionary.html : null;
	this.windowRef = (dictionary.html != 'undefined') ? dictionary.windowRef : false;
	this.windowTitle = (dictionary.windowTitle != 'undefined' ) ? dictionary.windowTitle : false;
	this.showActivity = (dictionary.showActivity != 'undefined'&& typeof dictionary.showActivity === 'boolean') ? dictionary.showActivity : false;
	this.scaleToFit = (dictionary.scaleToFit != 'undefined') ? dictionary.scaleToFit : false;
	this.activityMessage = (dictionary.activityMessage != 'undefined') ? dictionary.activityMessage : 'Loading';
	this.activityStyle = (dictionary.activityStyle !== 'undefined') ? dictionary.activityStyle : Ti.UI.iPhone.ActivityIndicatorStyle.PLAIN;

	var winBase;
	var nav;
	var windowBrowser;
	var webViewBrowser;
	var buttonCloseWindow;
	var activityIndicator;

	var toolbarButtons;
	var buttonBack;
	var buttonForward;
	var buttonStop;
	var buttonRefresh;
	var buttonAction;
	var buttonSpace;
	
	var actionDialog;
	
	var osname;
/**
 * Initialise a lower toolbar with browser buttons
 */	

	this.initToolbar = function() {
		this.initActions();
		buttonAction = Ti.UI.createButton({
			enabled : false
		});
		buttonBack = Ti.UI.createButton({
			image : "/modules/mini-browser/Icon-Back.png",
			enabled : false
		});
		buttonBack.addEventListener("click", function() {
			webViewBrowser.goBack();
		});
		buttonForward = Ti.UI.createButton({
			image : "/modules/mini-browser/Icon-Forward.png",
			enabled : false
		});
		buttonForward.addEventListener("click", function() {
			webViewBrowser.goForward();
		});
		buttonStop = Ti.UI.createButton();

		if(Ti.Platform.osname !== 'android') {

			buttonStop.systemButton = Titanium.UI.iPhone.SystemButton.STOP

		} else {
			buttonStop.image = '/modules/mini-browser/Icon-Stop.png';
		}

		buttonStop.addEventListener("click", function() {
			activityIndicator.hide();
			webViewBrowser.stopLoading();
			buttonBack.enabled = webViewBrowser.canGoBack();
			buttonForward.enabled = webViewBrowser.canGoForward();
			buttonAction.enabled = true;
			actionsDialog.title = webViewBrowser.url;
		});
		buttonRefresh = Ti.UI.createButton();
		if(Ti.Platform.osname !== 'android') {
			buttonRefresh.systemButton = Titanium.UI.iPhone.SystemButton.REFRESH;
		} else {
			buttonRefresh.image = '/modules/mini-browser/Icon-Reload.png';
		}
		buttonRefresh.addEventListener("click", function() {
			webViewBrowser.reload();
		});
		if(Ti.Platform.osname !== 'android') {
			buttonAction.systemButton = Titanium.UI.iPhone.SystemButton.ACTION;
			buttonAction.addEventListener("click", function() {
				actionsDialog.show();
			});
		} else {
			// actions in menu for android
			var actionsAct = windowBrowser.activity;
			actionsAct.onCreateOptionsMenu = function(e) {
				var menu = e.menu;
				var shareItems = menu.add({
					title : "Share"
				});
				var closeWindow = menu.add({
					title : "Close"
				});
				shareItems.addEventListener("click", function() {
					actionsDialog.show();
				});
				closeWindow.addEventListener("click", function() {
					actionsAct.finish();
				});
				
			}
		}

		if(Ti.Platform.osname !== 'android') {
			buttonSpace = Ti.UI.createButton({
				systemButton : Titanium.UI.iPhone.SystemButton.FLEXIBLE_SPACE
			});
			toolbarButtons = Ti.UI.iOS.createToolbar({
				barColor : this.barColor,
				bottom : 0,
				height : 44
			});
			toolbarButtons.items = [buttonBack, buttonSpace, buttonForward, buttonSpace, buttonRefresh, buttonSpace, buttonAction];

		} else {
			toolbarButtons = Ti.UI.createView({
				height : 44,
				bottom : 0,
				backgroundColor : this.barColor,
				layout : 'horizontal'
			});
			var spacerWidth = (Ti.Platform.displayCaps.platformWidth - (44)) / 4;
			Ti.API.info(spacerWidth);
			buttonBack.left = spacerWidth;
			buttonForward.left = spacerWidth;
			buttonRefresh.left = spacerWidth;
			toolbarButtons.add(buttonBack);
			toolbarButtons.add(buttonForward);
			toolbarButtons.add(buttonRefresh);
		}

		windowBrowser.add(toolbarButtons);
	},
	/**
	 * Initialise the options dialog for the loaded URL
	 */
	this.initActions = function() {
		actionsDialog = Ti.UI.createOptionDialog({
			options : [L("copy_link", "Copy link"), L("open_safari", "Open in Safari"), L("send_by_email", "Send by email"), L("cancel", "Cancel")],
			cancel : 3
		});

		actionsDialog.addEventListener("click", function(e) {
			switch(e.index) {
				case 0:
					Titanium.UI.Clipboard.setText(webViewBrowser.url);
					break;
				case 1:
					if(Titanium.Platform.canOpenURL(webViewBrowser.url)) {
						Titanium.Platform.openURL(webViewBrowser.url);
					}
					break;
				case 2:
					var emailDialog = Titanium.UI.createEmailDialog({
						barColor : windowBrowser.barColor
					});

					emailDialog.subject = windowBrowser.title;
					emailDialog.messageBody = webViewBrowser.url;
					emailDialog.open();
					break;
				default:
					break;
			}
		});
	}


/**
 * Allow the browser to be attached to an existing window within your application, or create a new window object
 */

	if(this.windowRef != true) {
		windowBrowser = Ti.UI.createWindow({
			barColor : this.barColor,
			backgroundColor : this.backgroundColor
		});
	} else {
		windowBrowser = this.windowRef;
	}
	

	if(this.showToolbar == true) {
		this.initToolbar();
	}


	
	
	if(this.modal == true) {
		winBase = Ti.UI.createWindow({
			navBarHidden : true,
			modal : true
		});


		if(Ti.Platform.osname !== 'android') {
			nav = Ti.UI.iPhone.createNavigationGroup({
				window : windowBrowser
			});
			winBase.add(nav);
			buttonCloseWindow = Ti.UI.createButton({
				title : L("close", "Close"),
				style : Ti.UI.iPhone.SystemButtonStyle.DONE
			});
			windowBrowser.leftNavButton = buttonCloseWindow;

			buttonCloseWindow.addEventListener("click", function() {
				winBase.close();
			});
		}

		winBase.addEventListener("close", function() {
			windowBrowser = null;
			nav = null;
			buttonCloseWindow = null;
			webViewBrowser = null;
			toolbarButtons = null;
			buttonBack = null;
			buttonForward = null;
			buttonStop = null;
			buttonRefresh = null;
			buttonAction = null;
			buttonSpace = null;
			winBase = null;
		});
	}

	
	webViewBrowser = Ti.UI.createWebView({
		url:this.url,
		left:0,
		top:0,
		bottom:(this.showToolbar) ? 44 : 0,
		width:"100%",
		loading:false
	});
	webViewBrowser.title = (this.windowTitle) ? this.windowTitle : false;
	windowBrowser.add(webViewBrowser);
	
	webViewBrowser.addEventListener("load", function() {
		
		activityIndicator.hide();
		Ti.API.info(webViewBrowser.title);
		windowBrowser.title = (webViewBrowser.title) ? webViewBrowser.title : webViewBrowser.evalJS("document.title");
	
		buttonBack.enabled = webViewBrowser.canGoBack();
		buttonForward.enabled = webViewBrowser.canGoForward();
		buttonAction.enabled = true;
		
		actionsDialog.title = webViewBrowser.url;
		
		toolbarButtons.items = [
			buttonBack,
			buttonSpace,
			buttonForward,
			buttonSpace,
			buttonRefresh,
			buttonSpace,
			buttonAction
		];
	
	});
	
	webViewBrowser.addEventListener("beforeload", function() {

		activityIndicator.show();
		
		buttonAction.enabled = false;
	
		toolbarButtons.items = [
			buttonBack,
			buttonSpace,
			buttonForward,
			buttonSpace,
			buttonStop,
			buttonSpace,
			buttonAction
		];
	
	});
	
	webViewBrowser.addEventListener("error", function() {

		activityIndicator.hide();

		buttonBack.enabled = webViewBrowser.canGoBack();
		buttonForward.enabled = webViewBrowser.canGoForward();
		buttonAction.enabled = true;
		
		actionsDialog.title = webViewBrowser.url;
		
		toolbarButtons.items = [
			buttonBack,
			buttonSpace,
			buttonForward,
			buttonSpace,
			buttonRefresh,
			buttonSpace,
			buttonAction
		];
	
	});
	
	activityIndicator = Ti.UI.createActivityIndicator({
		message: this.activityMessage
	});
	
	if(Ti.Platform.osname !== 'android'){
		activityIndicator.style = this.activityStyle;
		windowBrowser.rightNavButton = activityIndicator;
	} else {
		
	}
	
	this.openBrowser = function() {
		var win = (this.modal === true) ? winBase : windowBrowser;
		win.open();
	}

	this.returnBrowser = function() {
		return windowBrowser;
	}
	
	this.returnWebView = function() {
		return webViewBrowser;
	}
}

//create a blank object, just in case the user is still using the old Ti.include method
exports = exports || {};

exports.MiniBrowser = MiniBrowser;