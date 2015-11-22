var src;            // the audio src we are trying to play
	var soundInstance;  // the soundInstance returned by Sound when we create or play a src

function initSound() {
	// this does two things, it initializes the default plugins, and if that fails the if statement triggers and we display an error
	if (!createjs.Sound.initializeDefaultPlugins()) {
		document.getElementById("error").style.display = "block";
		document.getElementById("content").style.display = "none";
		return;
	}
	// check if we are on a mobile device, as these currently require us to launch sound inside of a user event
	if (createjs.BrowserDetect.isIOS || createjs.BrowserDetect.isAndroid || createjs.BrowserDetect.isBlackberry) {
		document.getElementById("mobile").style.display = "block";
		document.getElementById("content").style.display = "none";
		return;
	}
	// store the DOM element so we do not have to keep looking it up
	//displayStatus = document.getElementById("status");
	// Create a single item to load.
	var assetsPath = "audio/";
	src = assetsPath + "bird.wav";
	createjs.Sound.alternateExtensions = ["mp3"];	// add other extensions to try loading if the src file extension is not supported
	//createjs.Sound.onLoadComplete = playSound;  // add a callback for when load is completed
	createjs.Sound.addEventListener("fileload", playSound); // add an event listener for when load is completed
	createjs.Sound.registerSound(src);  // register sound, which preloads by default
	//displayStatus.innerHTML = "Waiting for load to complete.";  // letting the user know what's happening
}
function playSound(event) {
	soundInstance = createjs.Sound.play(event.src);  // start playing the sound we just loaded, storing the playing instance
	displayStatus.innerHTML = "Playing source: " + event.src;  // let the user know what we are playing
}