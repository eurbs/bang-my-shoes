
//City, Country, lat, lon, soundcloud track number
var location_dictionary=[
["Paris", "France", 48.865023, 2.328205, 120056951],
["Dublin", "Ireland", 53.342534, -6.272, 174090940],
["Boston", "USA", 42.3599492,-71.0557988, 120163885],
["San Francisco", "USA", 37.8039454,-122.4777254, 20615012],
["Sydney", "Australia", -33.858008,151.214097, 117929630],
["Nirobi", "Kenya", -1.3765767,36.7744464, 179592869]
]

var score = 600;
var scoreTimer = setInterval(scoreClock, 1000);

function scoreClock() {
    score -= 5;
    /*
    var disp = document.getElementById("clock");
    if(disp) {
    	disp.innerHTML = score;
    }
    */
}

function getScore(){return score;}

function stopScore() {
	var temp = score;
	score = 600;
	//window.clearInterval(scoreTimer);
	return score;
}

function chooseRandomLocation()
{
	//number between 1 - 7
	var rand = Math.floor(((Math.random()*6) + 1));
	var loc = { lat: location_dictionary[rand][2], lng: location_dictionary[rand][3]};
	
	//play associated song
	streamSound(location_dictionary[rand][4]);

	return loc;
}
