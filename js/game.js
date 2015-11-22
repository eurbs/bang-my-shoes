
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
var curWin = "Paris";
var delayScore = false;
var winPos = 0;

function scoreClock() {
	if(delayScore != true) {
		score -= 5;
		if(clockMesh) {
	    	UpdateClockTo(score.toString()+" pts");
	    }
	}
}

function DelayScore() {
	delayScore = true;
}

function UndelayScore() {
	delayScore = false;
}

function subtractScore() {
  score -= 100;
}

function punishScore() {
  score -= 200;
}

function getScore(){return score;}
function getWin(){
  return location_dictionary[winPos][0] + ", " + location_dictionary[winPos][1];
}

function getChoices() {
  var choices = [];
  var winChoicePos = Math.floor((Math.random()*3)); // 0,1,or2
  for (var i=0; i<3; i++) {
    if (i == winChoicePos) {
      choices.push(winPos);
    }
    else {
      while (true) {
        var rand = Math.floor((Math.random()*(location_dictionary.length)));
        console.log(rand);
        var j=0;
        for (j=0; j<choices.length; j++) {
          if (choices[j] == rand || (winPos == rand && i > winPos)) {
            break;
          }
        }
        if (j == choices.length) {
          choices.push(rand)
          break;
        }
      }
    }
    var choicesText = []
    for (var k=0; k<choices.length; k++) {
      choicesText.push(location_dictionary[choices[k]][0] + ", " + location_dictionary[choices[k]][1]);
    }
  }
  return choicesText;
}

function stopScore() {
	score += 600;
	//window.clearInterval(scoreTimer);
	return score;
}

function resetScore() {
	score = 600;
	//window.clearInterval(scoreTimer);
	return score;
}

function chooseRandomLocation()
{
	//number between 1 - 7
	var rand = Math.floor(((Math.random()*7)));
  winPos = rand;
	var loc = { country: location_dictionary[rand][1], city: location_dictionary[rand][0], lat: location_dictionary[rand][2], lng: location_dictionary[rand][3]};

	//play associated song
	streamSound(location_dictionary[rand][4]);

	return loc;
}
