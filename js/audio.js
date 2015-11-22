// var src;            // the audio src we are trying to play
// 	var soundInstance;  // the soundInstance returned by Sound when we create or play a src

// createjs.Sound.alternateExtensions = ["mp3"];
//  createjs.Sound.on("fileload", this.loadHandler, this);
//  createjs.Sound.registerSound("/audio/bird.wav", "sound");
//  function loadHandler(event) {
//      // This is fired for each sound that is registered.
//      var instance = createjs.Sound.play("sound");  // play using id.  Could also use full sourcepath or event.src.
//      instance.on("complete", this.handleComplete, this);
//      instance.volume = 0.5;
//  }

// function initPlaySound() {
// 	// this does two things, it initializes the default plugins, and if that fails the if statement triggers and we display an error
// 	if (!createjs.Sound.initializeDefaultPlugins(async=true)) {
// 		return;
// 	}
// 	// check if we are on a mobile device, as these currently require us to launch sound inside of a user event
// 	// if (createjs.BrowserDetect.isIOS || createjs.BrowserDetect.isAndroid || createjs.BrowserDetect.isBlackberry) {
// 	// 	return;
// 	// }
// 	// store the DOM element so we do not have to keep looking it up
// 	//displayStatus = document.getElementById("status");
// 	// Create a single item to load.
// 	var assetsPath = "audio/";
// 	src = assetsPath + "bird.wav";
// 	//createjs.Sound.alternateExtensions = ["mp3"];	// add other extensions to try loading if the src file extension is not supported
// 	//createjs.Sound.onLoadComplete = playSound;  // add a callback for when load is completed
// 	createjs.Sound.addEventListener("fileload", playSound, async=true); // add an event listener for when load is completed
// 	createjs.Sound.registerSound(src, async=true);  // register sound, which preloads by default
// 	//displayStatus.innerHTML = "Waiting for load to complete.";  // letting the user know what's happening
// }
// function playSound(event) {
// 	soundInstance = createjs.Sound.play(event.src, async=true);  // start playing the sound we just loaded, storing the playing instance
// 	//displayStatus.innerHTML = "Playing source: " + event.src;  // let the user know what we are playing
// }

function streamSound(trackNum)
{
	SC.stream('/tracks/' + trackNum).then(function(player){
		  player.play();
			});
}