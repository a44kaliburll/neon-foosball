const presets={chill:{goalie:.08,tracking:.035,speed:.85},arcade:{goalie:.17,tracking:.065,speed:1},pro:{goalie:.32,tracking:.10,speed:1.2}};
let difficulty=presets.arcade,paused=false,charge=0,charging=false,shotWindow=0,shotPower=0,superWindow=0,energy=0,idleBall=0,goalCountdown=0,toastTime=0;
let stats={shots:0,touches:0,seconds:0},held=new Set(),record={wins:0,best:0};
try{record=JSON.parse(localStorage.getItem('neon-foosball-record'))||record}catch(e){}
function showRecord(){document.getElementById('record').textContent=`${Number(record.wins)||0} WINS AT YOUR TABLE · BEST ${Number(record.best)||0} TIMED SHOTS`}
showRecord();
function setDifficulty(name,button){difficulty=presets[name];document.querySelectorAll('.levels button').forEach(b=>b.classList.remove('selected'));button.classList.add('selected')}
function toast(message){document.getElementById('toast').textContent=message;toastTime=1.2}
function resetArcade(){paused=false;charging=false;charge=0;energy=0;shotWindow=0;superWindow=0;goalCountdown=0;held.clear();stats={shots:0,touches:0,seconds:0};document.getElementById('play-controls').classList.remove('hidden');document.getElementById('pause-modal').classList.add('hidden');rods.forEach(r=>{r.group.position.x=0});toast('FIRST TO FIVE. LET’S GO!')}
function beginCharge(){if(isMatchActive&&!isGoalPause&&!paused){charging=true;charge=0}}
function releaseCharge(){if(!charging)return;charging=false;if(paused||isGoalPause||!isMatchActive)return;shotPower=charge;shotWindow=.34;charge=0;const r=rods.find(r=>r.team==='p'&&r.role===activeRole);if(r)r.flickTarget=-1.15}
function fireSuper(){if(energy<100||paused||!isMatchActive||isGoalPause)return;energy=0;superWindow=1.4;toast('BLAST ARMED — MAKE CONTACT!')}
function selectLiveRole(role){chooseRole(role);document.getElementById('hud-role-name').textContent=role.toUpperCase();if(isMatchActive)toast(role.toUpperCase()+' ROD')}
function cycleRole(){const roles=['goalie','defense','attack'];selectLiveRole(roles[(roles.indexOf(activeRole)+1)%3])}
function togglePause(){if(!isMatchActive)return;paused=!paused;charging=false;charge=0;held.clear();document.getElementById('pause-modal').classList.toggle('hidden',!paused)}
function quitMatch(){paused=false;goalCountdown=0;document.getElementById('pause-modal').classList.add('hidden');document.getElementById('goal-banner').classList.add('hidden');restartGame()}
function finishStats(won){charging=false;document.getElementById('play-controls').classList.add('hidden');if(won)record.wins=(Number(record.wins)||0)+1;record.best=Math.max(Number(record.best)||0,stats.shots);try{localStorage.setItem('neon-foosball-record',JSON.stringify(record))}catch(e){}showRecord();document.getElementById('match-stats').innerHTML=`<div><b>${stats.shots}</b><span>TIMED SHOTS</span></div><div><b>${stats.touches}</b><span>TOUCHES</span></div><div><b>${Math.floor(stats.seconds/60)}:${String(Math.floor(stats.seconds%60)).padStart(2,'0')}</b><span>MATCH TIME</span></div>`}
function arcadeTick(){
 if(paused)return;
 toastTime=Math.max(0,toastTime-1/60);document.getElementById('toast').style.opacity=toastTime>0?1:0;
 if(!isMatchActive)return;
 if(goalCountdown>0){goalCountdown-=1/60;if(goalCountdown<=0){document.getElementById('goal-banner').classList.add('hidden');if(scores.player>=5||scores.ai>=5)concludeMatch(scores.player>=5);else{isGoalPause=false;resetBall(true)}}}
 if(!isGoalPause){stats.seconds+=1/60;if(held.has('arrowleft')||held.has('a'))mouseNormX=Math.max(0,mouseNormX-.018);if(held.has('arrowright')||held.has('d'))mouseNormX=Math.min(1,mouseNormX+.018);if(charging)charge=Math.min(1,charge+1/45);shotWindow=Math.max(0,shotWindow-1/60);superWindow=Math.max(0,superWindow-1/60)}
 document.getElementById('charge-fill').style.width=charge*100+'%';document.getElementById('charge-label').textContent=charging?(charge>=1?'FULL POWER!':'CHARGING…'):'HOLD SPACE';document.getElementById('energy-fill').style.width=energy+'%';document.getElementById('energy-label').textContent=energy>=100?'READY · PRESS E':Math.floor(energy)+'%';document.getElementById('super-btn').classList.toggle('ready',energy>=100);
}
window.addEventListener('keydown',e=>{if(['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName))return;const k=e.key.toLowerCase();if([' ','arrowleft','arrowright'].includes(k)&&isMatchActive)e.preventDefault();if(e.repeat)return;held.add(k);if(k===' ')beginCharge();if(k==='e')fireSuper();if(k==='escape'||k==='p')togglePause();if(isMatchActive&&['1','2','3'].includes(k))selectLiveRole(['goalie','defense','attack'][Number(k)-1])});
window.addEventListener('keyup',e=>{held.delete(e.key.toLowerCase());if(e.key===' ')releaseCharge()});
window.addEventListener('blur',()=>{held.clear();if(isMatchActive&&!paused)togglePause()});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&isMatchActive&&!paused)togglePause()});
const strike=document.getElementById('strike-btn');strike.addEventListener('pointerdown',e=>{e.preventDefault();strike.setPointerCapture(e.pointerId);beginCharge()});strike.addEventListener('pointerup',releaseCharge);strike.addEventListener('pointercancel',()=>{charging=false;charge=0});
window.addEventListener('pointerdown',e=>{if(e.target.tagName==='CANVAS')mouseNormX=pointerAim(e.clientX)});
function pointerAim(x){if(!camera)return .5;const left=new THREE.Vector3(-FW/2,0,0).project(camera);const right=new THREE.Vector3(FW/2,0,0).project(camera);const a=(left.x+1)*innerWidth/2,b=(right.x+1)*innerWidth/2;return Math.max(0,Math.min(1,(x-a)/(b-a)))}
let trail=[],rodHalo=null,visualReady=false,aimArrow=null;
function updateArcadeVisuals(){
 if(!scene||!ballMesh)return;
 if(!visualReady){
  visualReady=true;
  for(let i=0;i<12;i++){const mesh=new THREE.Mesh(new THREE.SphereGeometry(BALL_R*(1-i/15),8,6),new THREE.MeshBasicMaterial({color:0xc5ff61,transparent:true,opacity:0,depthWrite:false}));scene.add(mesh);trail.push(mesh)}
  rodHalo=new THREE.Mesh(new THREE.PlaneGeometry(PLAY_W,.75),new THREE.MeshBasicMaterial({color:0xc5ff61,transparent:true,opacity:.18,depthWrite:false,side:THREE.DoubleSide}));rodHalo.rotation.x=-Math.PI/2;scene.add(rodHalo);
 }
 if(!aimArrow){aimArrow=new THREE.ArrowHelper(new THREE.Vector3(0,0,-1),new THREE.Vector3(),3,0xc5ff61,.4,.25);scene.add(aimArrow)}
 aimArrow.visible=!!possession&&possession.rod.team==='p'&&isMatchActive;
 if(aimArrow.visible){const shot=footShot(possession.rod,possession.offset,charge);aimArrow.position.copy(ballMesh.position);aimArrow.position.y=.15;aimArrow.setDirection(new THREE.Vector3(shot.x,0,shot.z).normalize());aimArrow.setLength(2.2+charge*1.8,.4,.25)}
 const rod=rods.find(r=>r.team==='p'&&r.role===activeRole);
 rodHalo.visible=isMatchActive;
 if(rod){rodHalo.position.set(0,.035,rod.group.position.z);rodHalo.material.opacity=.12+charge*.15}
 if(paused)return;
 for(let i=trail.length-1;i>0;i--)trail[i].position.copy(trail[i-1].position);
 trail[0].position.copy(ballMesh.position);
 const speed=Math.hypot(bVel.x,bVel.z);
 trail.forEach((m,i)=>{m.material.opacity=isMatchActive&&!isGoalPause&&speed>.18?(1-i/12)*Math.min(.4,speed*.65):0;m.material.color.setHex(speed>.45?0xc5ff61:0x74eaff)})
}

// Speeds use table units per fixed 60 Hz physics step.
let possession=null,flight='loose',catchLock=0,sourceRod=null,sourceLock=0,trapWindow=0;
const FOOT_WRAP_X=P_W/2+BALL_R+.04,FOOT_WRAP_Z=P_D/2+BALL_R+.035;
function clearPossession(){possession=null;flight='loose';catchLock=0;sourceRod=null;sourceLock=0;trapWindow=0;updatePossessionUI()}
function updatePossessionUI(){const label=document.getElementById('possession-label');if(label)label.textContent=possession?(possession.rod.team==='p'?'MAGNET CONTROL · DRAG TO AIM 360°':'RIVALS IN POSSESSION'):(trapWindow>0?'TRAP READY — MEET THE BALL':flight==='shot'?'LIVE SHOT · SHIFT TO TRAP':'LOOSE BALL · SLOW BALLS STICK');}
function possessionTick(){catchLock=Math.max(0,catchLock-1/60);sourceLock=Math.max(0,sourceLock-1/60);trapWindow=Math.max(0,trapWindow-1/60);if(possession){possession.time+=1/60;if(possession.rod.team==='ai'||possession.rod.team==='a'){if(possession.time>.65/difficulty.speed)launchHeld('shot',.35)}}updatePossessionUI()}
function followPossession(advance=false){
 if(!possession||!advance)return;
 const state=possession,{rod,figure}=state,footX=rod.group.position.x+figure.localX;
 const movement=footX-state.lastFootX;
 state.lastFootX=footX;
 // Rod travel rolls the magnetic contact all the way around the foot.
 // A damped spring pulls the ball toward it without teleporting the ball.
 state.orbitVelocity=state.orbitVelocity*.72-movement*.22;
 state.angle-=movement*1.8;
 state.angle+=state.orbitVelocity;
 if(rod.team!=='p')state.angle+=Math.atan2(Math.sin(-state.angle),Math.cos(-state.angle))*.12;
 const direction=rod.team==='p'?-1:1;
 const targetX=footX+Math.sin(state.angle)*FOOT_WRAP_X;
 const targetZ=rod.group.position.z+direction*Math.cos(state.angle)*FOOT_WRAP_Z;
 state.vx=(state.vx+(targetX-ballMesh.position.x)*.14)*.68;
 state.vz=(state.vz+(targetZ-ballMesh.position.z)*.14)*.68;
 const oldX=ballMesh.position.x,oldZ=ballMesh.position.z;
 ballMesh.position.x=clampAim(oldX+state.vx,-PLAY_W/2+BALL_R,PLAY_W/2-BALL_R);
 ballMesh.position.z=clampAim(oldZ+state.vz,-FH/2+BALL_R,FH/2-BALL_R);
 ballMesh.position.y=BALL_R;
 ballMesh.rotation.x+=(ballMesh.position.z-oldZ)/BALL_R;
 ballMesh.rotation.z-=(ballMesh.position.x-oldX)/BALL_R;
 state.offset=ballMesh.position.x-footX;
 bVel={x:state.vx,y:0,z:state.vz};idleBall=0;
}
function clampAim(value,min,max){return Math.max(min,Math.min(max,value))}
function footShot(rod,offset,power=0,superShot=false){
 const direction=rod.team==='p'?-1:1;
 const faceAngle=possession&&possession.rod===rod
  ?Math.atan2(ballMesh.position.x-rod.group.position.x-possession.figure.localX,(ballMesh.position.z-rod.group.position.z)*direction)
  :Math.atan2(offset,FOOT_WRAP_Z);
 const sliceAngle=clampAim((rod.slideVel||0)*2.8,-.42,.42);
 const angle=faceAngle+sliceAngle;
 const speed=superShot?.66:.30+clampAim(power,0,1)*.24;
 return {x:Math.sin(angle)*speed,z:(rod.team==='p'?-1:1)*Math.cos(angle)*speed};
}
function trapBall(){if(!isMatchActive||paused||isGoalPause)return;trapWindow=.4;toast('TRAP READY');updatePossessionUI()}
function takePossession(rod,figure){
 const footX=rod.group.position.x+figure.localX,direction=rod.team==='p'?-1:1;
 possession={rod,figure,time:0,offset:ballMesh.position.x-footX,lastFootX:footX,
  angle:Math.atan2((ballMesh.position.x-footX)/FOOT_WRAP_X,(ballMesh.position.z-rod.group.position.z)*direction/FOOT_WRAP_Z),
  orbitVelocity:0,vx:bVel.x*.25,vz:bVel.z*.25};
 flight='loose';trapWindow=0;shotWindow=0;
 if(rod.team==='p'){
  stats.touches++;energy=Math.min(100,energy+7);selectLiveRole(rod.role);
  const limit=(PLAY_W/2-P_W/2)-rod.maxLocalX;
  mouseNormX=limit>0?clampAim(rod.group.position.x/(limit*2)+.5,0,1):.5;
  toast('MAGNET CONTROL · DRAG TO ROLL AROUND');
 }
 updatePossessionUI();
}
function handleFootContact(rod,figure){
 if(possession|| (rod===sourceRod&&sourceLock>0))return;
 const speed=Math.hypot(bVel.x,bVel.z),user=rod.team==='p'&&rod.role===activeRole;
 const deliberate=user&&trapWindow>0;
 if(user&&(shotWindow>0||superWindow>0)){const kind=superWindow>0?'super':'shot',power=shotPower;takePossession(rod,figure);launchHeld(kind,power);return;}
 if(catchLock<=0&&(deliberate||speed<.145||(flight==='pass'&&rod.team==='p'&&speed<.24))){takePossession(rod,figure);return;}
 // A hard shot hits a solid foot and keeps moving; no automatic counter-shot.
 const side=ballMesh.position.z>=rod.group.position.z?1:-1;
 ballMesh.position.z=rod.group.position.z+side*(P_D/2+BALL_R+.04);
 bVel.z=side*Math.max(.065,Math.abs(bVel.z)*.82);
 const offset=clampAim((ballMesh.position.x-rod.group.position.x-figure.localX)/(P_W/2),-1,1);
 bVel.x=bVel.x*.87+offset*Math.abs(bVel.z)*.55+(rod.slideVel||0)*.6;
 flight='shot';catchLock=.10;sourceRod=rod;sourceLock=.10;
 rod.flickTarget=side*.25;playSfx('bumper');spawnImpact(ballMesh.position.x,ballMesh.position.z,'bumper',0x74eaff);
}
function launchHeld(kind,power=0){
 if(!possession)return false;
 const {rod,figure}=possession;followPossession();
 const friendly=rod.team==='p',direction=friendly?-1:1;
 const shot=footShot(rod,possession.offset,power,kind==='super');
 let vx=shot.x,vz=shot.z;
 if(kind==='pass'){
  // Same contact direction as a shot, with a softer, catchable release.
  const speed=Math.hypot(shot.x,shot.z);
  vx=shot.x/speed*.21;vz=shot.z/speed*.21;
  charging=false;charge=0;
  toast('PASS AWAY · FOLLOW YOUR AIM');
 }else{if(kind==='super'){toast('NEON BLAST!')}else if(friendly)toast(power>.7?'POWER SHOT!':'SHOT AWAY');if(friendly){stats.shots++;energy=Math.min(100,energy+12)}}
 possession=null;flight=kind==='pass'?'pass':'shot';catchLock=kind==='pass'?.12:.25;sourceRod=rod;sourceLock=.3;shotWindow=0;superWindow=0;
 bVel={x:vx,y:0,z:vz};rod.flickTarget=direction*.95;playSfx('kick');spawnImpact(ballMesh.position.x,ballMesh.position.z,'kick',friendly?0xc5ff61:0xf43f5e,vx,vz);updatePossessionUI();return true;
}
function passBall(){if(!isMatchActive||paused||isGoalPause)return;if(possession&&possession.rod.team==='p')launchHeld('pass');else toast('CONTROL THE BALL TO PASS')}
const originalReleaseCharge=releaseCharge;
releaseCharge=function(){if(charging&&possession&&possession.rod.team==='p'&&!paused&&!isGoalPause){const power=charge;charging=false;charge=0;launchHeld('shot',power)}else originalReleaseCharge()};
const originalFireSuper=fireSuper;
fireSuper=function(){if(energy>=100&&possession&&possession.rod.team==='p'&&!paused&&!isGoalPause&&isMatchActive){energy=0;launchHeld('super',1)}else originalFireSuper()};
window.addEventListener('keydown',e=>{if(e.repeat||['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName))return;if(e.key.toLowerCase()==='f')passBall();if(e.key==='Shift'){e.preventDefault();trapBall()}});

