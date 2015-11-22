/**
 * @author troffmo5 / http://github.com/troffmo5
 *
 * Google Street View viewer for the Oculus Rift
 */

try {
  Myo.connect();
  Myo.unlock();
} catch (err) {
  // do nothing. Leave uncaught if there are no myos available.
}

// Parameters
// ----------------------------------------------
var QUALITY = 3;
//var DEFAULT_LOCATION = { lat:44.301945982379095,  lng:9.211585521697998 };
var DEFAULT_LOCATION = { lat:48.865023,  lng:2.328205 };
var USE_TRACKER = false;
var GAMEPAD_SPEED = 0.04;
var DEADZONE = 0.2;
var SHOW_SETTINGS = true;
var NAV_DELTA = 45;
var FAR = 1000;
var USE_DEPTH = true;
var WORLD_FACTOR = 1.0;

// Globals
// ----------------------------------------------
var WIDTH, HEIGHT;
var currHeading = 0;
var centerHeading = 0;
var navList = [];

var headingVector = new THREE.Euler();
var gamepadMoveVector = new THREE.Vector3();
var textMesh;
var clockMesh;

// Utility function
// ----------------------------------------------
function angleRangeDeg(angle) {
  angle %= 360;
  if (angle < 0) angle += 360;
  return angle;
}

function angleRangeRad(angle) {
  angle %= 2*Math.PI;
  if (angle < 0) angle += 2*Math.PI;
  return angle;
}

function deltaAngleDeg(a,b) {
  return Math.min(360-(Math.abs(a-b)%360),Math.abs(a-b)%360);
}

function deltaAngleRas(a,b) {
  // todo
}

function bend( group, amount, multiMaterialObject ) {
  function bendVertices( mesh, amount, parent ) {
    var vertices = mesh.geometry.vertices;

    if (!parent) {
      parent = mesh;
    }

    for (var i = 0; i < vertices.length; i++) {
      var vertex = vertices[i];

      // apply bend calculations on vertexes from world coordinates
      parent.updateMatrixWorld();

      var worldVertex = parent.localToWorld(vertex);

      var worldX = Math.sin( worldVertex.x / amount) * amount;
      var worldZ = - Math.cos( worldVertex.x / amount ) * amount;
      var worldY = worldVertex.y  ;

      // convert world coordinates back into local object coordinates.
      var localVertex = parent.worldToLocal(new THREE.Vector3(worldX, worldY, worldZ));
      vertex.x = localVertex.x;
      vertex.z = localVertex.z+amount;
      vertex.y = localVertex.y;
    }

    mesh.geometry.computeBoundingSphere();
    mesh.geometry.verticesNeedUpdate = true;
  }

  for ( var i = 0; i < group.children.length; i ++ ) {
    var element = group.children[ i ];

    if (element.geometry.vertices) {
      if (multiMaterialObject) {
        bendVertices( element, amount, group);
      } else {
        bendVertices( element, amount);
      }
    }
  }
}


// ----------------------------------------------

function loadOverlay(city)
{
  overlay = new THREE.Object3D();
  var mesh = new THREE.Mesh(
    new THREE.PlaneGeometry( 63, 30, 20, 20 ),
    new THREE.MeshBasicMaterial({
      transparent: true,
      alphaTest: 0.5,
      side: THREE.FrontSide,
      map: THREE.ImageUtils.loadTexture('images/' + city + 'Overlay.png')
  }));
  overlay.add( mesh );
  overlay.position.set( 0, 0, -5 );
  overlay.scale.set( 0.1, 0.1, 0.1 );
  bend(overlay, 100);
  mesh.renderDepth = 1;
  scene.add( overlay );
}

function initWebGL() {
  // create scene
  scene = new THREE.Scene();

  // Create camera
  camera = new THREE.PerspectiveCamera( 60, WIDTH/HEIGHT, 0.1, FAR );
  camera.target = new THREE.Vector3( 1, 0, 0 );

  controls  = new THREE.VRControls(camera);

  scene.add( camera );

  // Add projection sphere
  projSphere = new THREE.Mesh( new THREE.SphereGeometry( 500, 512, 256, 0, Math.PI * 2, 0, Math.PI), new THREE.MeshBasicMaterial({ map: THREE.ImageUtils.loadTexture('placeholder.png'), side: THREE.DoubleSide}) );
  projSphere.geometry.dynamic = true;
  scene.add( projSphere );

  //attempt to do overlay text here
  //scene = new THREE.Scene();
  //loadOverlay("SanFrancisco");
  // Add Progress Bar
  progBarContainer = new THREE.Mesh( new THREE.BoxGeometry(1.2,0.2,0.1), new THREE.MeshBasicMaterial({color: 0xaaaaaa}));
  progBarContainer.translateZ(-3);
  camera.add( progBarContainer );

  progBar = new THREE.Mesh( new THREE.BoxGeometry(1.0,0.1,0.1), new THREE.MeshBasicMaterial({color: 0x0000ff}));
  progBar.translateZ(0.2);
  progBarContainer.add(progBar);

  //AddTextMesh("Welcome");

  // Create render
  try {
    renderer = new THREE.WebGLRenderer();
  }
  catch(e){
    alert('This application needs WebGL enabled!');
    return false;
  }

  renderer.autoClearColor = false;
  renderer.setSize( WIDTH, HEIGHT );

  effect = new THREE.VREffect( renderer );
  effect.setSize(WIDTH, HEIGHT );

  vrmgr = new WebVRManager(effect);

  var viewer = $('#viewer');
  viewer.append(renderer.domElement); 
}

function initControls() {

  // Keyboard
  // ---------------------------------------
  var lastSpaceKeyTime = new Date(),
      lastCtrlKeyTime = lastSpaceKeyTime;

  $(document).keydown(function(e) {
    //console.log(e.keyCode);
    switch(e.keyCode) {
      case 32: // Space
        var spaceKeyTime = new Date();
        if (spaceKeyTime-lastSpaceKeyTime < 300) {
          $('.ui').toggle(200);
        }
        lastSpaceKeyTime = spaceKeyTime;
        break;
      case 71: //grouppon
        loadOverlay("cat");
        break;
      case 17: // Ctrl
        var ctrlKeyTime = new Date();
        if (ctrlKeyTime-lastCtrlKeyTime < 300) {
          moveToNextPlace();
        }
        lastCtrlKeyTime = ctrlKeyTime;
        break;
      case 39: //both left and right arrow keys manually advance scene
      case 37:
        NextLocation();
        break;
      case 83: //S toggles sound
        killSound();
        break;
      case 82: //r resets score
        resetScore();
      case 18: // Alt
        USE_DEPTH = !USE_DEPTH;
        $('#depth').prop('checked', USE_DEPTH);
        setSphereGeometry();
        break;
    }
  });

  // Mouse
  // ---------------------------------------
  var viewer = $('#viewer');

  viewer.dblclick(function() {
    moveToNextPlace();
  });

  // Gamepad
  // ---------------------------------------
  gamepad = new Gamepad();
  gamepad.bind(Gamepad.Event.CONNECTED, function(device) {
    console.log("Gamepad CONNECTED");
  });

  gamepad.bind(Gamepad.Event.BUTTON_DOWN, function(e) {
    if (e.control == "FACE_2") {
      $('.ui').toggle(200);
    }
  });

  // Look for tick event so that we can hold down the FACE_1 button and
  // continually move in the current direction
  gamepad.bind(Gamepad.Event.TICK, function(gamepads) {
    // Multiple calls before next place has finished loading do not matter
    // GSVPano library will ignore these
    if (gamepads[0].state.FACE_1 === 1) {
      moveToNextPlace();
    }
  });

  gamepad.bind(Gamepad.Event.AXIS_CHANGED, function(e) {

    // ignore deadzone
    var value = e.value;
    if (value < -DEADZONE) value = value + DEADZONE;
    else if(value > DEADZONE) value = value - DEADZONE;
    else value = 0;

    if (e.axis == "LEFT_STICK_X") {
      gamepadMoveVector.y = -value*GAMEPAD_SPEED;
    }
    else if (e.axis == "LEFT_STICK_Y") {
      gamepadMoveVector.x = -value*GAMEPAD_SPEED;
    }
  });

  if (!gamepad.init()) {
    //console.log("Gamepad not supported");
  }
}

function initGui()
{
  if (!SHOW_SETTINGS) {
    $('.ui').hide();
  }

  $('#depth').change(function(event) {
    USE_DEPTH = $('#depth').is(':checked');
    setSphereGeometry();
  });
  window.addEventListener( 'resize', resize, false );

}

var overlay;

function initPano() {
  panoLoader = new GSVPANO.PanoLoader();
  panoDepthLoader = new GSVPANO.PanoDepthLoader();
  panoLoader.setZoom(QUALITY);

  panoLoader.onProgress = function( progress ) {
    if (progress > 0) {
      progBar.visible = true;
      progBar.scale = new THREE.Vector3(progress/100.0,1,1);
    }
    $(".mapprogress").progressbar("option", "value", progress);

  };
  panoLoader.onPanoramaData = function( result ) {
    progBarContainer.visible = true;
    progBar.visible = false;
    $('.mapprogress').show();
  };

  panoLoader.onNoPanoramaData = function( status ) {
    //alert('no data!');
  };

  panoLoader.onPanoramaLoad = function() {
    var a = THREE.Math.degToRad(90-panoLoader.heading);
    projSphere.quaternion.setFromEuler(new THREE.Euler(0, a, 0, 'YZX'));

    projSphere.material.wireframe = false;
    projSphere.material.map.needsUpdate = true;
    projSphere.material.map = new THREE.Texture( this.canvas );
    projSphere.material.map.needsUpdate = true;
    centerHeading = panoLoader.heading;

    progBarContainer.visible = false;
    progBar.visible = false;

    marker.setMap( null );
    marker= new google.maps.Marker({ position: this.location.latLng, map: gmap});
    marker.setMap( gmap);

    $('.mapprogress').hide();

    if (window.history) {
      var newUrl = '?lat='+this.location.latLng.lat()+'&lng='+this.location.latLng.lng();
      newUrl += USE_TRACKER ? '&sock='+escape(WEBSOCKET_ADDR.slice(5)) : '';
      newUrl += '&q='+QUALITY;
      newUrl += '&s='+$('#settings').is(':visible');
      newUrl += '&heading='+currHeading;
      window.history.pushState('','',newUrl);
    }

    panoDepthLoader.load(this.location.pano);
  };

  panoDepthLoader.onDepthLoad = function() {
    setSphereGeometry();
  };
}

function setSphereGeometry() {
  var geom = projSphere.geometry;
  var geomParam = geom.parameters;
  var depthMap = panoDepthLoader.depthMap.depthMap;
  var y, x, u, v, radius, i=0;
  for ( y = 0; y <= geomParam.heightSegments; y ++ ) {
    for ( x = 0; x <= geomParam.widthSegments; x ++ ) {
      u = x / geomParam.widthSegments;
      v = y / geomParam.heightSegments;

      radius = USE_DEPTH ? Math.min(depthMap[y*512 + x], FAR) : 500;

      var vertex = geom.vertices[i];
      vertex.x = - radius * Math.cos( geomParam.phiStart + u * geomParam.phiLength ) * Math.sin( geomParam.thetaStart + v * geomParam.thetaLength );
      vertex.y = radius * Math.cos( geomParam.thetaStart + v * geomParam.thetaLength );
      vertex.z = radius * Math.sin( geomParam.phiStart + u * geomParam.phiLength ) * Math.sin( geomParam.thetaStart + v * geomParam.thetaLength );
      i++;
    }
  }
  geom.verticesNeedUpdate = true;
}

function initGoogleMap() {
  $('.mapprogress').progressbar({ value: false });
  currentLocation = new google.maps.LatLng( DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lng );

  var mapel = $('#map');
  mapel.on('mousemove', function (e) {
      e.stopPropagation();
  });
  gmap = new google.maps.Map(mapel[0], {
    zoom: 14,
    center: currentLocation,
    mapTypeId: google.maps.MapTypeId.HYBRID,
    streetViewControl: false
  });
  google.maps.event.addListener(gmap, 'click', function(event) {
    panoLoader.load(event.latLng);
  });

  google.maps.event.addListener(gmap, 'center_changed', function(event) {
  });
  google.maps.event.addListener(gmap, 'zoom_changed', function(event) {
  });
  google.maps.event.addListener(gmap, 'maptypeid_changed', function(event) {
  });

  svCoverage= new google.maps.StreetViewCoverageLayer();
  svCoverage.setMap(gmap);

  geocoder = new google.maps.Geocoder();

  $('#mapsearch').change(function() {
      geocoder.geocode( { 'address': $('#mapsearch').val()}, function(results, status) {
      if (status == google.maps.GeocoderStatus.OK) {
        gmap.setCenter(results[0].geometry.location);
      }
    });
  }).on('keydown', function (e) {
    e.stopPropagation();
  });

  marker = new google.maps.Marker({ position: currentLocation, map: gmap });
  marker.setMap( gmap );
}

function initGoogleMapWith(loc) {
  $('.mapprogress').progressbar({ value: false });
  currentLocation = new google.maps.LatLng( loc.lat, loc.lng );

  var mapel = $('#map');
  mapel.on('mousemove', function (e) {
      e.stopPropagation();
  });
  gmap = new google.maps.Map(mapel[0], {
    zoom: 14,
    center: currentLocation,
    mapTypeId: google.maps.MapTypeId.HYBRID,
    streetViewControl: false
  });
  google.maps.event.addListener(gmap, 'click', function(event) {
    panoLoader.load(event.latLng);
  });

  google.maps.event.addListener(gmap, 'center_changed', function(event) {
  });
  google.maps.event.addListener(gmap, 'zoom_changed', function(event) {
  });
  google.maps.event.addListener(gmap, 'maptypeid_changed', function(event) {
  });

  svCoverage= new google.maps.StreetViewCoverageLayer();
  svCoverage.setMap(gmap);

  geocoder = new google.maps.Geocoder();

  $('#mapsearch').change(function() {
      geocoder.geocode( { 'address': $('#mapsearch').val()}, function(results, status) {
      if (status == google.maps.GeocoderStatus.OK) {
        gmap.setCenter(results[0].geometry.location);
      }
    });
  }).on('keydown', function (e) {
    e.stopPropagation();
  });

  marker = new google.maps.Marker({ position: currentLocation, map: gmap });
  marker.setMap( gmap );
}

function checkWebVR() {
  if(!vrmgr.isWebVRCompatible()) {
    $("#webvrinfo").dialog({
      modal: true,
      buttons: {
        Ok: function() {
          $(this).dialog("close");
        }
      }
    });
  }
  else {
    $("#webvrinfo").hide();
  }
}


function moveToNextPlace() {
  var nextPoint = null;
  var minDelta = 360;
  var navList = panoLoader.links;
  for (var i = 0; i < navList.length; i++) {
    var delta = deltaAngleDeg(currHeading, navList[i].heading);
    if (delta < minDelta && delta < NAV_DELTA) {
      minDelta = delta;
      nextPoint = navList[i].pano;
    }
  }

  if (nextPoint) {
    panoLoader.load(nextPoint);
  }
}

function render() {
  if (vrmgr.isVRMode()) {
    effect.render( scene, camera );
  }
  else {
    renderer.render(scene, camera);
  }
}

function setUiSize() {
  var width = window.innerWidth, hwidth = width/2,
      height = window.innerHeight;

  var ui = $('#ui-main');
  var hsize=0.60, vsize = 0.40, outOffset=0;
  ui.css('width', hwidth*hsize);
  ui.css('left', hwidth-hwidth*hsize/2) ;
  ui.css('height', height*vsize);
  ui.css('margin-top', height*(1-vsize)/2);

}

function resize( event ) {
  WIDTH = window.innerWidth;
  HEIGHT = window.innerHeight;
  setUiSize();

  renderer.setSize( WIDTH, HEIGHT );
  camera.projectionMatrix.makePerspective( 60, WIDTH /HEIGHT, 1, 1100 );
}

function loop() {
  requestAnimationFrame( loop );

  // Apply movement
  // BaseRotationEuler.set( angleRangeRad(BaseRotationEuler.x + gamepadMoveVector.x), angleRangeRad(BaseRotationEuler.y + gamepadMoveVector.y), 0.0 );
  // BaseRotation.setFromEuler(BaseRotationEuler, 'YZX');

  // Compute heading
  headingVector.setFromQuaternion(camera.quaternion, 'YZX');
  currHeading = angleRangeDeg(THREE.Math.radToDeg(-headingVector.y));

  controls.update();

  // render
  render();
}

function getParams() {
  var params = {};
  var items = window.location.search.substring(1).split("&");
  for (var i=0;i<items.length;i++) {
    var kvpair = items[i].split("=");
    params[kvpair[0]] = unescape(kvpair[1]);
  }
  return params;
}

function FirstLocation()
{
    try{
    var loc = chooseRandomLocation();//{ lat: 42.345573, lng: -71.098326 };
    panoLoader.load( new google.maps.LatLng( loc.lat, loc.lng ) );
    //alert(loc.city)
    // AddTextMesh(loc.city + ", " + loc.country);
    }
    catch(error)
    {
      panoLoader.load( new google.maps.LatLng( DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lng ) );
    }


    resetScore();
    
}

var skipped = true;

function NextLocation()
{   
    if(skipped) {
      punishScore();
      console.log("punish");
    }
    try{RemoveTextMesh();}catch(e){}
    try{
    var loc = chooseRandomLocation();//{ lat: 42.345573, lng: -71.098326 };
    panoLoader.load( new google.maps.LatLng( loc.lat, loc.lng ) );
    //alert(loc.city)
    //AddTextMesh(loc.city + ", " + loc.country);
    }
    catch(error)
    {
      panoLoader.load( new google.maps.LatLng( DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lng ) );
    }
    UndelayScore();
    stopScore();
    skipped = true;
}

function PasteText() 
{
    var text2 = document.createElement('div');
    text2.style.position = 'absolute';
    //text2.style.zIndex = 1;    // if you still don't see the label, try uncommenting this
    text2.style.width = 500;
    text2.style.height = 500;
    text2.innerHTML = "Paris";
    text2.style.top = 500+ 'px';
    text2.style.left = 500 + 'px';
    text2.style.fontSize = "50px";
    text2.style.color = "white";
    document.body.appendChild(text2);
}

function AddText(title, type="caption") 
{
    var text2 = document.createElement('div');
    text2.setAttribute("id", type);
    text2.style.position = 'absolute';
    //text2.style.zIndex = 1;    // if you still don't see the label, try uncommenting this
    text2.style.width = 500;
    text2.style.height = 500;
    text2.innerHTML = title;
    text2.style.top = 500+ 'px';
    text2.style.left = 500 + 'px';
    text2.style.fontSize = "70px";
    text2.style.color = "white";
    text2.backgroundColor = "rgba(0, 0, 0, 0.3)";
    text2.padding = "25px";
    document.body.appendChild(text2);
}

function RemoveText(type) 
{
    document.getElementById(type).remove();
}

function AddTextMesh(title)
{ 
    // add 3D text
    var materialFront = new THREE.MeshBasicMaterial( { color: 0xffffff } );
    var materialSide = new THREE.MeshBasicMaterial( { color: 0x333333 } );
    var materialArray = [ materialFront, materialSide ];

    // var chromeTexture = THREE.ImageUtils.loadTexture( 'Chrome.png' );
    // chromeTexture.wrapS = chromeTexture.wrapT = THREE.RepeatWrapping;
    // chromeTexture.repeat.set( 0.5, 0.5 );
    // var chromeMaterial = new THREE.MeshBasicMaterial( { map: chromeTexture } );
    
    // var lavaTexture = THREE.ImageUtils.loadTexture( 'lava.jpg' );
    // lavaTexture.wrapS = lavaTexture.wrapT = THREE.RepeatWrapping;
    // lavaTexture.repeat.set( 0.05, 0.05 );
    // var lavaMaterial = new THREE.MeshBasicMaterial( { map: lavaTexture } );
    
    // var materialArray = [ lavaMaterial, chromeMaterial ];

    var textGeom = new THREE.TextGeometry( title, 
    {
      size: 15, height: 5, curveSegments: 2,
      font: "helvetiker", style: "normal",
      bevelThickness: 0.2, bevelSize: 0.2, bevelEnabled: true,
      material: 0, extrudeMaterial: 1
    });
    
    var textMaterial = new THREE.MeshFaceMaterial(materialArray);
    textMesh = new THREE.Mesh(textGeom, textMaterial );
    textMesh.name = "text";
    
    textGeom.computeBoundingBox();
    var textWidth = textGeom.boundingBox.max.x - textGeom.boundingBox.min.x;

    textMesh.position.set( 0, 0, -5 );
    textMesh.scale.set( 0.1, 0.1, 0.2 );
    bend(textMesh, 100);

    // var pLocal = new THREE.Vector3( 0, 0, -1 );
    // var pWorld = pLocal.applyMatrix4( camera.matrixWorld );
    // var dir = pWorld.sub( camera.position ).normalize();
    // textMesh.position.set(dir.position.x, - dir.position.y, dir.position.z);
    //textMesh.position.set(camera.position.x, - camera.position.y, camera.position.z);
    // textMesh.rotation.x = Math.PI / 2;
    // t.o.camera.position.x, -1000, t.o.camera.position.z 
    scene.add(textMesh);
}


function RemoveTextMesh()
{
    var selectedObject = scene.getObjectByName(textMesh.name);
    scene.remove( selectedObject );
    loop();
}

function AddClock()
{
    
    //var material = new THREE.MeshBasicMaterial( { color: 0x000000 } );
    var materialFront = new THREE.MeshBasicMaterial( { color: 0xffffff } );
    var materialSide = new THREE.MeshBasicMaterial( { color: 0x333333 } );
    var materialArray = [ materialFront, materialSide ];
    var material = new THREE.MeshFaceMaterial(materialArray);

    var textGeom = new THREE.TextGeometry( "600 pts", {
        size: 15, height: 10, curveSegments: 2,
        font: 'helvetiker', // Must be lowercase!
        style: "normal"
    });
    clockMesh = new THREE.Mesh( textGeom, material );    
    textGeom.computeBoundingBox();
    var textWidth = textGeom.boundingBox.max.x - textGeom.boundingBox.min.x;
    clockMesh.name = "clock";

    clockMesh.position.set( 0, 20, -10 );
    clockMesh.scale.set( 0.1, 0.1, 0.1 );
    clockMesh.rotation.x = -5;
    clockMesh.rotation.y = 6;
    bend(clockMesh, 100);
    scene.add(clockMesh);
}

function UpdateClockTo(text)
{
    var selectedObject = scene.getObjectByName(clockMesh.name);
    scene.remove( selectedObject );
    //var material = new THREE.MeshBasicMaterial( { color: 0x000000 } );
    var materialFront = new THREE.MeshBasicMaterial( { color: 0xffffff } );
    var materialSide = new THREE.MeshBasicMaterial( { color: 0x333333 } );
    var materialArray = [ materialFront, materialSide ];
    var material = new THREE.MeshFaceMaterial(materialArray);

    var textGeom = new THREE.TextGeometry( text, {
        size: 15, height: 10, curveSegments: 2,
        font: 'helvetiker', // Must be lowercase!
        style: "normal"
    });
    clockMesh = new THREE.Mesh( textGeom, material );    
    textGeom.computeBoundingBox();
    var textWidth = textGeom.boundingBox.max.x - textGeom.boundingBox.min.x;
    clockMesh.name = "clock";

    clockMesh.position.set( 0, 20, -10 );
    clockMesh.scale.set( 0.1, 0.1, 0.1 );
    clockMesh.rotation.x = -5;
    clockMesh.rotation.y = 6;
    bend(clockMesh, 100);
    scene.add(clockMesh);
}

function EndGame ()
{
  DelayScore();
  // add the cat
  AddTextMesh("End Game. Look Up.");
}

/* ----------- MYO GESTURES ----------- */

var fistCount = 0;
var spreadCount = 0;
var curChoice = 1;
var choices;

Myo.on('fist', function () {
  switch(fistCount) {
    case 0:   // bring up choice menu
      DelayScore();
      choices = getChoices();
      AddTextMesh(choices[curChoice]);
      fistCount = 1;
      break;
    case 1:   // select option
      skipped = false;
      valid = (getWin() == choices[curChoice]);
      if (valid != true) {
        subtractScore();
      }
      RemoveTextMesh();
      if (valid == true) {
        AddTextMesh("CORRECT");
      } else {
        AddTextMesh("WRONG ANSWER");
      }
      fistCount = 2;
      break;
    default:
      break;
  }
});

Myo.on('wave_in', function () {
  if (fistCount == 1 && curChoice > 0) {
    RemoveTextMesh();
    curChoice -= 1;
    AddTextMesh(choices[curChoice]);
  }
});

Myo.on('wave_out', function () {
  if (fistCount == 1 && curChoice < 2) {
    RemoveTextMesh();
    curChoice += 1;
    AddTextMesh(choices[curChoice]);
  }
});

// move to next location
Myo.on('fingers_spread', function () {
  if (fistCount == 2) { 
    fistCount = 0
    NextLocation();
  } else if (spreadCount == 1 && fistCount == 0) {
    EndGame();
  }
});

$(document).ready(function() {

  // Read parameters
  params = getParams();
  if (params.lat !== undefined) DEFAULT_LOCATION.lat = params.lat;
  if (params.lng !== undefined) DEFAULT_LOCATION.lng = params.lng;
  if (params.sock !== undefined) {WEBSOCKET_ADDR = 'ws://'+params.sock; USE_TRACKER = true;}
  if (params.q !== undefined) QUALITY = params.q;
  if (params.s !== undefined) SHOW_SETTINGS = params.s !== "false";
  // if (params.heading !== undefined) {
  //   BaseRotationEuler.set(0.0, angleRangeRad(THREE.Math.degToRad(-parseFloat(params.heading))) , 0.0 );
  //   BaseRotation.setFromEuler(BaseRotationEuler, 'YZX');
  // }
  if (params.depth !== undefined) USE_DEPTH = params.depth !== "false";
  if (params.wf !== undefined) WORLD_FACTOR = parseFloat(params.wf);

  WIDTH = window.innerWidth; HEIGHT = window.innerHeight;
  $('.ui').tabs({
    activate: function( event, ui ) {
      var caller = event.target.id;
      if (caller == 'ui-main') {
        $("#ui-main").tabs("option","active");
      }
    }
  });
  // PasteText();
  setUiSize();
  initWebGL();
  initControls();
  initGui();
  initPano();
  initGoogleMap();
  $("#ui-main").css("opacity", "0");

  // Load default location

  //panoLoader.load( new google.maps.LatLng( DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lng ) );
  FirstLocation();

  checkWebVR();

  loop();
  AddClock();
});
