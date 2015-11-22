function streamSound(trackNum)
{
	SC.stream('/tracks/' + trackNum).then(function(player){
		  player.play();
			});
}