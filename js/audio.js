var sound = true;
var active;

function streamSound(trackNum)
{
	if(sound)
	{
		SC.stream('/tracks/' + trackNum).then(function(player){
			active = player;
			  player.play();
				});
	}
}

function killSound()
{
	sound = false;
	active.stop();
}