from pathlib import Path
import re
root=Path(__file__).parent
s=(root/'original.html').read_text(encoding='utf-8')
s=s.replace('<title>Tactical Foosball Pro</title>','<title>Neon Foosball — Pocket Arcade</title>').replace('    <script src="https://cdn.tailwindcss.com"></script>','')
start=s.index('<div id="ui-layer"')
end=s.index('<script>',start)
s=s[:start]+(root/'ui.html').read_text(encoding='utf-8')+'\n'+s[end:]
s=s.replace('</head>','<link rel="stylesheet" href="arcade.css">\n</head>')
s=s.replace('function animate() {\n        requestAnimationFrame(animate);','''let lastFrame = 0, accumulator = 0;
    function animate(now) {
        requestAnimationFrame(animate);
        if (!lastFrame) lastFrame = now;
        accumulator += Math.min((now-lastFrame)/1000, 0.1);
        lastFrame = now;
        if (accumulator < 1/60) return;
        while (accumulator >= 1/60) {
        accumulator -= 1/60;
        arcadeTick();''')
s=s.replace('        renderer.render(scene, camera);','        }\n        renderer.render(scene, camera);')
s=s.replace('        arcadeTick();','        arcadeTick();\n        updateArcadeVisuals();')
s=s.replace('e.clientX / window.innerWidth','pointerAim(e.clientX)').replace('e.touches[0].clientX / window.innerWidth','pointerAim(e.touches[0].clientX)')
s=s.replace('if (e.touches.length > 0) {',"if (e.touches.length > 0 && e.target.tagName === 'CANVAS') {")
s=s.replace('        isGoalPause = true;', '        isGoalPause = true;\n        charging=false; charge=0; shotWindow=0; superWindow=0;')
s=s.replace('isMatchActive && !isGoalPause','isMatchActive && !isGoalPause && !paused')
s=s.replace("window.addEventListener('keydown', e => {\n            if (e.key === 'ArrowLeft' || e.key === 'a') mouseNormX = Math.max(0, mouseNormX - 0.05);\n            if (e.key === 'ArrowRight' || e.key === 'd') mouseNormX = Math.min(1, mouseNormX + 0.05);\n        });",'')
s=s.replace("const reactionDelay = rod.role === 'goalie' ? 0.85 : 0.075;","const reactionDelay = rod.role === 'goalie' ? difficulty.goalie : difficulty.tracking;")
s=s.replace('if (ballMesh.position.y > BALL_R) {','if (ballMesh.position.y > BALL_R || bVel.y > 0) {')
s=s.replace('const lateralSpeed = anglePower * 0.32 + (rod.slideVel || 0) * 0.85;', 'let lateralSpeed = anglePower * 0.32 + (rod.slideVel || 0) * 0.85;')
s=s.replace('const forwardDrive = Math.max(0.14, baseDriveSpeed - Math.abs(clampedOffset) * 0.05);','''let forwardDrive = Math.max(0.14, baseDriveSpeed - Math.abs(clampedOffset) * 0.05);
                    if (isUserControlled && shotWindow > 0) {
                        forwardDrive *= 1.65 + shotPower * 0.7;
                        lateralSpeed *= 1.15;
                        stats.shots++; energy = Math.min(100, energy + 18);
                        toast(shotPower > .7 ? 'POWER SHOT!' : 'NICE TIMING!');
                        shotWindow = 0;
                    }
                    if (isUserControlled && superWindow > 0) {
                        forwardDrive = .66; lateralSpeed *= .6;
                        superWindow = 0; toast('NEON BLAST!');
                        cameraShake.intensity = .28;
                    }
                    if (isUserControlled) { stats.touches++; energy = Math.min(100, energy + 7); }
                    if (!isGreen) forwardDrive *= difficulty.speed;''')
# Keep the ball moving even when no figure can reach it.
s=s.replace('        // Tabletop Motion & Tactical Friction','''        if (Math.hypot(bVel.x,bVel.z) < .055 && ballMesh.position.y <= BALL_R + .01) {
            idleBall++;
            if (idleBall > 70) { bVel.z = ballMesh.position.z > 0 ? -.16 : .16; bVel.x = (Math.random()-.5)*.15; idleBall=0; toast('BACK IN PLAY'); }
        } else idleBall=0;
        // Tabletop Motion & Tactical Friction''')
# Goal timers use simulation time, so pausing also pauses celebrations.
a=s.index('        setTimeout(() => {',s.index('function triggerGoal'))
b=s.index('        }, 1800);',a)+len('        }, 1800);')
s=s[:a]+'''        goalCountdown = 1.8;
        if (scorer === 'player') energy = Math.min(100, energy + 22);'''+s[b:]
s=s.replace('        initAudio();\n        playSfx(\'whistle\');',"        try { initAudio(); } catch(e) {}\n        playSfx('whistle');\n        resetArcade();")
s=s.replace('        isMatchActive = false;\n        const modal', '        isMatchActive = false;\n        finishStats(playerWon);\n        const modal')
s=s.replace("        resetBall(true);\n    }\n\n    // Initialize", "        resetBall(true);\n        document.getElementById('play-controls').classList.add('hidden');\n    }\n\n    // Initialize")
s=s.replace('        initEngine();',"        try { initEngine(); } catch(e) { document.getElementById('load-error').hidden=false; console.error(e); }")
s=s.replace('</body>','<script src="arcade.js"></script>\n</body>')
# Possession replaces automatic kicks with traps, shots, passes and rebounds.
s=s.replace('    function updateMatchPhysics() {','    function updateMatchPhysics() {\n        possessionTick();\n        if (!possession) {')
s=s.replace('        // Rod Movement & Player Figurine Collision Checking','        }\n        // Rod Movement & Player Figurine Collision Checking')
a=s.index('                    // Mechanical Wrist-Flick Execution')
b=s.index('\n                }\n            });\n        });',a)
s=s[:a]+'                    handleFootContact(rod, p);'+s[b:]
marker='\n    function chooseRole(role)'
a=s.index(marker)
prefix=s[:a]
at=prefix.rfind('        });\n    }')
s=prefix[:at]+prefix[at:].replace('        });\n    }','        });\n        followPossession(true);\n    }',1)+s[a:]
s=s.replace('        dropBounces = 0;', '        clearPossession();\n        dropBounces = 0;')
s=s.replace('        isGoalPause = true;', '        clearPossession();\n        isGoalPause = true;')
(root/'index.html').write_text(s,encoding='utf-8')
