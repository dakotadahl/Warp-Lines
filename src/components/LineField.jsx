import React, { useEffect, useRef } from 'react'
import './LineField.css'

const LineField = () => {
  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const animationFrameRef = useRef(null)
  
  // Configuration
  const CONFIG = {
    pointsPerLine: 60,
    color: { r: 253, g: 87, b: 75 },
    lineWidth: 0.5,
    cursorRadius: 180,
    dragStrength: 16,
    baseStrength: 300,
    wakeLength: 200,
    wakeLengthSquared: 200 * 200,
    velocitySmoothing: 0.15,
    mouseSmoothing: 0.12,
    noiseTimeScale: 0.0000008,
    noiseAmplitude: 8,
    driftSpeed: 0.00000002,
    driftAmplitude: 4,
    driftWaveLength: 0.008,
    vanishingPointY: 0.95,
    minVelocityForWake: 0.3,
    maxCursorDistance: 600,
    maxCursorDistanceSquared: 600 * 600,
    easeFactorMin: 0.002,
    easeFactorMax: 0.02,
    easeFactorDivisor: 800,
    springStrength: 0.15,
    springDamping: 0.85,
    waveInfluence: 0.08,
    waveRadius: 80,
    waveRadiusSquared: 80 * 80,
    verticalFlow: 0.3,
    flowSpeed: 0.00001,
    pointVelocityDamping: 0.92,
    curlStrength: 0.4,
    turbulenceScale: 0.003
  }

  const GYRO_LIQUID_CONFIG = {
    tiltSensitivity: 0.0008,
    damping: 0.88,
    springStrength: 0.00015,
    maxVelocity: 12,
    overshootFactor: 1.15,
    oscillationDamping: 0.92,
    waveFrequency: 0.003,
    waveAmplitude: 0.3
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d', { alpha: false })
    const strokeColor = `rgba(${CONFIG.color.r},${CONFIG.color.g},${CONFIG.color.b},0.85)`
    const bgColor = '#0a0506'

    // Noise Generator (Simplex Noise)
    const noise = (() => {
      const perm = new Uint8Array(512)
      for (let i = 0; i < 256; i++) {
        perm[i] = perm[i + 256] = Math.floor(Math.random() * 256)
      }
      
      const grad3 = [
        [1,1,0], [-1,1,0], [1,-1,0], [-1,-1,0],
        [1,0,1], [-1,0,1], [1,0,-1], [-1,0,-1],
        [0,1,1], [0,-1,1], [0,1,-1], [0,-1,-1]
      ]
      
      const dot = (g, x, y) => g[0] * x + g[1] * y
      const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10)
      const lerp = (a, b, t) => a + t * (b - a)
      
      return (x, y) => {
        const X = Math.floor(x) & 255
        const Y = Math.floor(y) & 255
        x -= Math.floor(x)
        y -= Math.floor(y)
        
        const u = fade(x)
        const v = fade(y)
        const A = perm[X] + Y
        const B = perm[X + 1] + Y
        
        return lerp(
          lerp(
            dot(grad3[perm[A] % 12], x, y),
            dot(grad3[perm[B] % 12], x - 1, y),
            u
          ),
          lerp(
            dot(grad3[perm[A + 1] % 12], x, y - 1),
            dot(grad3[perm[B + 1] % 12], x - 1, y - 1),
            u
          ),
          v
        )
      }
    })()

    // State Management
    let width = 0
    let height = 0
    let lines = []
    
    const mouse = { x: -1000, y: -1000 }
    const targetMouse = { x: -1000, y: -1000 }
    const prevMouse = { x: -1000, y: -1000 }
    const velocity = { x: 0, y: 0 }
    
    // Gyroscope state
    let gyroEnabled = false
    let gyroCalibrated = false
    let gyroCalibration = { alpha: 0, beta: 0, gamma: 0 }
    let gyroTarget = { x: -1000, y: -1000 }
    let gyroPosition = { x: 0, y: 0 }
    let gyroVelocity = { x: 0, y: 0 }
    let gyroAcceleration = { x: 0, y: 0 }
    let useGyro = false
    let gyroValidated = false
    let gyroValidationSamples = []
    let gyroValidationStartTime = 0
    let isAutoEnabled = false
    
    let currentGyroValues = { alpha: 0, beta: 0, gamma: 0 }
    let currentGyroDeltas = { alpha: 0, beta: 0, gamma: 0 }
    
    let time = 0
    const vanishingPoint = { x: 0, y: 0 }

    // Line Initialization
    function initLines() {
      lines = []
      
      const originalLineCount = 200
      const targetLineCount = Math.ceil(originalLineCount * 1.4)
      const spacing = width / (targetLineCount + 1)
      
      const pointsPerLine = CONFIG.pointsPerLine
      const pointStep = 1 / (pointsPerLine - 1)
      
      for (let i = 0; i < targetLineCount; i++) {
        const canvasX = spacing * (i + 1)
        const normalizedX = (i + 1) / (targetLineCount + 1)
        
        const line = {
          points: [],
          restPoints: [],
          index: i,
          normalizedX
        }
        
        for (let j = 0; j < pointsPerLine; j++) {
          const t = j * pointStep
          const y = t * height
          const point = { x: canvasX, y, vx: 0, vy: 0 }
          const restPoint = { x: canvasX, y, normalizedY: t }
          
          line.points.push(point)
          line.restPoints.push(restPoint)
        }
        
        lines.push(line)
      }
    }

    // Resize Handler
    function resize() {
      const dpr = window.devicePixelRatio || 1
      width = window.innerWidth
      height = window.innerHeight
      
      canvas.width = width * dpr
      canvas.height = height * dpr
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      
      ctx.scale(dpr, dpr)
      vanishingPoint.x = width / 2
      vanishingPoint.y = height * CONFIG.vanishingPointY
      
      if (gyroTarget.x === -1000) {
        const centerX = width / 2
        const centerY = height / 2
        gyroTarget.x = centerX
        gyroTarget.y = centerY
        gyroPosition.x = centerX
        gyroPosition.y = centerY
      } else if (gyroCalibrated) {
        const centerX = width / 2
        const centerY = height / 2
        gyroPosition.x = centerX
        gyroPosition.y = centerY
        gyroTarget.x = centerX
        gyroTarget.y = centerY
      }
      
      initLines()
    }

    // Update Points Logic
    function updatePoints() {
      updateGyroscopePhysics()
      
      if (useGyro && gyroEnabled && gyroCalibrated) {
        targetMouse.x = gyroTarget.x
        targetMouse.y = gyroTarget.y
      }
      
      prevMouse.x = mouse.x
      prevMouse.y = mouse.y
      mouse.x += (targetMouse.x - mouse.x) * CONFIG.mouseSmoothing
      mouse.y += (targetMouse.y - mouse.y) * CONFIG.mouseSmoothing
      
      const mouseDeltaX = mouse.x - prevMouse.x
      const mouseDeltaY = mouse.y - prevMouse.y
      velocity.x += (mouseDeltaX - velocity.x) * CONFIG.velocitySmoothing
      velocity.y += (mouseDeltaY - velocity.y) * CONFIG.velocitySmoothing
      
      const timeNoiseX = time * CONFIG.noiseTimeScale
      const timeNoiseY = timeNoiseX * 0.7
      const timeDrift = time * CONFIG.driftSpeed * 1000
      const velMagSquared = velocity.x * velocity.x + velocity.y * velocity.y
      const velMag = Math.sqrt(velMagSquared)
      const hasVelocity = velMag > CONFIG.minVelocityForWake
      
      const wakeLength = CONFIG.wakeLength
      const wakeLengthSquared = CONFIG.wakeLengthSquared
      const maxCursorDistSquared = CONFIG.maxCursorDistanceSquared
      const noiseAmp = CONFIG.noiseAmplitude
      const driftAmp = CONFIG.driftAmplitude
      const baseStrength = CONFIG.baseStrength
      const dragStrength = CONFIG.dragStrength
      
      const verticalFlowOffset = Math.sin(time * CONFIG.flowSpeed) * CONFIG.verticalFlow
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        const normalizedX = line.normalizedX
        const noiseX = normalizedX * 3 + timeNoiseX
        
        const driftBase = Math.sin(normalizedX * Math.PI * 6 + timeDrift) * driftAmp
        
        const prevLine = i > 0 ? lines[i - 1] : null
        const nextLine = i < lines.length - 1 ? lines[i + 1] : null
        const waveStrength = CONFIG.waveInfluence
        
        for (let j = 0; j < line.points.length; j++) {
          const rest = line.restPoints[j]
          const point = line.points[j]
          
          let neighborInfluenceX = 0
          if (prevLine && nextLine && j < prevLine.points.length && j < nextLine.points.length) {
            const prevPoint = prevLine.points[j]
            const nextPoint = nextLine.points[j]
            const dxPrev = prevPoint.x - rest.x
            const dxNext = nextPoint.x - rest.x
            neighborInfluenceX = (dxPrev + dxNext) * waveStrength * 0.5
          }
          
          const noiseVal = noise(noiseX, rest.normalizedY * 2 + timeNoiseY)
          const turbulenceVal = noise(
            normalizedX * 5 + time * CONFIG.turbulenceScale,
            rest.normalizedY * 3 + time * CONFIG.turbulenceScale * 0.5
          ) * 0.3
          
          const dxFromCursor = rest.x - mouse.x
          const dyFromCursor = rest.y - mouse.y
          const distFromCursorSquared = dxFromCursor * dxFromCursor + dyFromCursor * dyFromCursor
          
          let ambientX = 0
          let ambientY = verticalFlowOffset
          
          if (distFromCursorSquared < maxCursorDistSquared) {
            const distFromCursor = Math.sqrt(distFromCursorSquared)
            const ambientScale = 0.3 + (1 - distFromCursor / CONFIG.maxCursorDistance) * 2
            const dirX = distFromCursor > 0 ? dxFromCursor / distFromCursor : 0
            const dirY = distFromCursor > 0 ? dyFromCursor / distFromCursor : 0
            
            const curlAngle = Math.atan2(dyFromCursor, dxFromCursor) + Math.PI / 2
            const curlX = Math.cos(curlAngle) * CONFIG.curlStrength * ambientScale
            const curlY = Math.sin(curlAngle) * CONFIG.curlStrength * ambientScale
            
            ambientX = (noiseVal * noiseAmp + driftBase + turbulenceVal) * ambientScale * dirX + curlX
            ambientY += curlY * 0.5
          } else {
            ambientX = (noiseVal * noiseAmp + driftBase + turbulenceVal) * 0.3
          }
          
          ambientX += neighborInfluenceX
          
          const dx = rest.x - mouse.x
          const dy = rest.y - mouse.y
          const distSquared = dx * dx + dy * dy
          
          let dragOffsetX = 0
          let dragOffsetY = 0
          
          if (distSquared < wakeLengthSquared && hasVelocity) {
            const dist = Math.sqrt(distSquared)
            const distFalloff = Math.pow(1 - dist / wakeLength, 2)
            
            const invDist = 1 / Math.max(dist, 1)
            const pushX = dx * invDist
            const pushY = dy * invDist
            
            const dragInfluence = Math.min(velMag / 5, 1)
            const invVelMag = 1 / velMag
            const blendedX = pushX * (1 - dragInfluence * 0.7) + velocity.x * invVelMag * dragInfluence
            const blendedY = pushY * (1 - dragInfluence * 0.7) + velocity.y * invVelMag * dragInfluence
            
            const velFactor = Math.min(velMag / 4, 1)
            const strength = (baseStrength * velFactor * velFactor + velMag * dragStrength) * distFalloff
            
            dragOffsetX = blendedX * strength
            dragOffsetY = blendedY * strength * 0.4
          }
          
          const targetX = rest.x + ambientX + dragOffsetX
          const targetY = rest.y + ambientY + dragOffsetY
          
          let springForceX = 0
          let springForceY = 0
          
          if (j > 0) {
            const prevPoint = line.points[j - 1]
            const springDX = prevPoint.x - point.x
            const springDY = prevPoint.y - point.y
            springForceX += springDX * CONFIG.springStrength
            springForceY += springDY * CONFIG.springStrength
          }
          
          if (j < line.points.length - 1) {
            const nextPoint = line.points[j + 1]
            const springDX = nextPoint.x - point.x
            const springDY = nextPoint.y - point.y
            springForceX += springDX * CONFIG.springStrength
            springForceY += springDY * CONFIG.springStrength
          }
          
          point.vx *= CONFIG.pointVelocityDamping
          point.vy *= CONFIG.pointVelocityDamping
          
          const diffX = targetX - point.x
          const diffY = targetY - point.y
          const diffSquared = diffX * diffX + diffY * diffY
          const diffMag = Math.sqrt(diffSquared)
          
          const easeFactor = CONFIG.easeFactorMin + Math.min(diffMag / CONFIG.easeFactorDivisor, CONFIG.easeFactorMax)
          
          point.vx += (diffX * easeFactor + springForceX) * (1 - CONFIG.springDamping)
          point.vy += (diffY * easeFactor + springForceY) * (1 - CONFIG.springDamping)
          
          point.x += point.vx
          point.y += point.vy
          
          point.x += diffX * easeFactor * CONFIG.springDamping
          point.y += diffY * easeFactor * CONFIG.springDamping
        }
      }
      
      updateDevMode()
    }

    // Rendering
    function drawLine(points) {
      if (points.length < 2) return
      
      ctx.strokeStyle = strokeColor
      ctx.lineWidth = CONFIG.lineWidth
      ctx.beginPath()
      ctx.moveTo(points[0].x, points[0].y)
      
      const lastIndex = points.length - 1
      for (let i = 1; i < lastIndex; i++) {
        const current = points[i]
        const next = points[i + 1]
        const midX = (current.x + next.x) * 0.5
        const midY = (current.y + next.y) * 0.5
        ctx.quadraticCurveTo(current.x, current.y, midX, midY)
      }
      
      const last = points[lastIndex]
      ctx.lineTo(last.x, last.y)
      ctx.stroke()
    }

    function render(timestamp) {
      time = timestamp
      
      ctx.fillStyle = bgColor
      ctx.fillRect(0, 0, width, height)
      
      updatePoints()
      
      for (let i = 0; i < lines.length; i++) {
        drawLine(lines[i].points)
      }
      
      animationFrameRef.current = requestAnimationFrame(render)
    }

    // Gyroscope Handling
    function requestGyroPermission() {
      if (typeof DeviceOrientationEvent !== 'undefined' && 
          typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission()
          .then(response => {
            if (response === 'granted') {
              enableGyroscope()
            }
          })
          .catch(console.error)
      } else {
        enableGyroscope()
      }
    }

    function enableGyroscope(autoEnable = false) {
      gyroEnabled = true
      gyroCalibrated = false
      gyroValidated = false
      gyroValidationSamples = []
      gyroValidationStartTime = Date.now()
      isAutoEnabled = autoEnable
    }

    function calibrateGyroscope(alpha, beta, gamma) {
      gyroCalibration.alpha = alpha || 0
      gyroCalibration.beta = beta || 0
      gyroCalibration.gamma = gamma || 0
      gyroCalibrated = true
      if (isAutoEnabled) {
        useGyro = true
      }
    }

    function validateGyroscopeInput(e) {
      if (gyroValidated) return true
      
      const alpha = e.alpha
      const beta = e.beta
      const gamma = e.gamma
      
      if (alpha === null || alpha === undefined ||
          beta === null || beta === undefined ||
          gamma === null || gamma === undefined) {
        return false
      }
      
      gyroValidationSamples.push({ alpha, beta, gamma, timestamp: Date.now() })
      
      const oneSecondAgo = Date.now() - 1000
      gyroValidationSamples = gyroValidationSamples.filter(s => s.timestamp > oneSecondAgo)
      
      if (gyroValidationSamples.length < 5) {
        return false
      }
      
      let maxAlphaDiff = 0
      let maxBetaDiff = 0
      let maxGammaDiff = 0
      
      for (let i = 1; i < gyroValidationSamples.length; i++) {
        const prev = gyroValidationSamples[i - 1]
        const curr = gyroValidationSamples[i]
        
        const alphaDiff = Math.abs(curr.alpha - prev.alpha)
        const betaDiff = Math.abs(curr.beta - prev.beta)
        const gammaDiff = Math.abs(curr.gamma - prev.gamma)
        
        const normalizedAlphaDiff = Math.min(alphaDiff, 360 - alphaDiff)
        
        maxAlphaDiff = Math.max(maxAlphaDiff, normalizedAlphaDiff)
        maxBetaDiff = Math.max(maxBetaDiff, betaDiff)
        maxGammaDiff = Math.max(maxGammaDiff, gammaDiff)
      }
      
      const validationDuration = Date.now() - gyroValidationStartTime
      const hasVariation = maxAlphaDiff > 0.5 || maxBetaDiff > 0.5 || maxGammaDiff > 0.5
      const hasEnoughTime = validationDuration > 2000
      
      if (hasVariation || hasEnoughTime) {
        gyroValidated = true
        useGyro = true
        const gyroControl = document.querySelector('.gyro-control')
        if (gyroControl) {
          gyroControl.style.display = 'none'
        }
        return true
      }
      
      return false
    }

    function updateDevMode() {
      const devMode = document.getElementById('devMode')
      if (!devMode) return
      
      const alphaEl = document.getElementById('devAlpha')
      const betaEl = document.getElementById('devBeta')
      const gammaEl = document.getElementById('devGamma')
      
      if (alphaEl) alphaEl.textContent = currentGyroValues.alpha.toFixed(2) + '°'
      if (betaEl) betaEl.textContent = currentGyroValues.beta.toFixed(2) + '°'
      if (gammaEl) gammaEl.textContent = currentGyroValues.gamma.toFixed(2) + '°'
      
      const deltaAlphaEl = document.getElementById('devDeltaAlpha')
      const deltaBetaEl = document.getElementById('devDeltaBeta')
      const deltaGammaEl = document.getElementById('devDeltaGamma')
      
      if (deltaAlphaEl) {
        let deltaAlpha = currentGyroDeltas.alpha
        if (deltaAlpha > 180) deltaAlpha -= 360
        if (deltaAlpha < -180) deltaAlpha += 360
        deltaAlphaEl.textContent = deltaAlpha.toFixed(2) + '°'
      }
      if (deltaBetaEl) deltaBetaEl.textContent = currentGyroDeltas.beta.toFixed(2) + '°'
      if (deltaGammaEl) deltaGammaEl.textContent = currentGyroDeltas.gamma.toFixed(2) + '°'
      
      const posXEl = document.getElementById('devPosX')
      const posYEl = document.getElementById('devPosY')
      const velXEl = document.getElementById('devVelX')
      const velYEl = document.getElementById('devVelY')
      
      if (posXEl) posXEl.textContent = Math.round(gyroPosition.x)
      if (posYEl) posYEl.textContent = Math.round(gyroPosition.y)
      if (velXEl) velXEl.textContent = gyroVelocity.x.toFixed(2)
      if (velYEl) velYEl.textContent = gyroVelocity.y.toFixed(2)
      
      const enabledEl = document.getElementById('devEnabled')
      const calibratedEl = document.getElementById('devCalibrated')
      const activeEl = document.getElementById('devActive')
      
      if (enabledEl) enabledEl.textContent = gyroEnabled ? 'true' : 'false'
      if (calibratedEl) calibratedEl.textContent = gyroCalibrated ? 'true' : 'false'
      if (activeEl) activeEl.textContent = useGyro ? 'true' : 'false'
    }

    function handleDeviceOrientation(e) {
      if (!gyroEnabled) {
        const alpha = e.alpha
        const beta = e.beta
        const gamma = e.gamma
        
        const hasValidData = (alpha !== null && alpha !== undefined) ||
                            (beta !== null && beta !== undefined) ||
                            (gamma !== null && gamma !== undefined)
        
        if (hasValidData) {
          enableGyroscope(true)
        } else {
          return
        }
      }
      
      validateGyroscopeInput(e)
      
      const alpha = e.alpha !== null ? e.alpha : 0
      const beta = e.beta !== null ? e.beta : 0
      const gamma = e.gamma !== null ? e.gamma : 0
      
      currentGyroValues.alpha = alpha
      currentGyroValues.beta = beta
      currentGyroValues.gamma = gamma
      
      if (!gyroCalibrated) {
        calibrateGyroscope(alpha, beta, gamma)
        const centerX = width / 2
        const centerY = height / 2
        gyroTarget.x = centerX
        gyroTarget.y = centerY
        gyroPosition.x = centerX
        gyroPosition.y = centerY
        gyroVelocity.x = 0
        gyroVelocity.y = 0
        currentGyroDeltas.alpha = 0
        currentGyroDeltas.beta = 0
        currentGyroDeltas.gamma = 0
        updateDevMode()
        return
      }
      
      const deltaAlpha = alpha - gyroCalibration.alpha
      const deltaBeta = beta - gyroCalibration.beta
      const deltaGamma = gamma - gyroCalibration.gamma
      
      currentGyroDeltas.alpha = deltaAlpha
      currentGyroDeltas.beta = deltaBeta
      currentGyroDeltas.gamma = deltaGamma
      
      updateDevMode()
      
      if (!useGyro) return
      
      let normalizedAlpha = deltaAlpha
      if (normalizedAlpha > 180) normalizedAlpha -= 360
      if (normalizedAlpha < -180) normalizedAlpha += 360
      
      const centerX = width / 2
      const centerY = height / 2
      
      const gammaRange = 50
      const gammaNormalized = Math.max(-1, Math.min(1, deltaGamma / gammaRange))
      const targetX = centerX + gammaNormalized * width * 0.45
      
      const betaRange = 70
      const betaNormalized = Math.max(-1, Math.min(1, deltaBeta / betaRange))
      const targetY = centerY + betaNormalized * height * 0.45
      
      const alphaInfluence = 0.15
      const alphaNormalized = Math.max(-1, Math.min(1, normalizedAlpha / 100))
      
      gyroTarget.x = targetX + alphaNormalized * width * alphaInfluence
      gyroTarget.y = targetY
      
      gyroTarget.x = Math.max(0, Math.min(width, gyroTarget.x))
      gyroTarget.y = Math.max(0, Math.min(height, gyroTarget.y))
      
      const tiltMagnitude = Math.sqrt(
        deltaGamma * deltaGamma + deltaBeta * deltaBeta
      )
      const tiltDirectionX = deltaGamma !== 0 ? deltaGamma / Math.abs(deltaGamma) : 0
      const tiltDirectionY = deltaBeta !== 0 ? deltaBeta / Math.abs(deltaBeta) : 0
      
      gyroAcceleration.x = tiltDirectionX * tiltMagnitude * GYRO_LIQUID_CONFIG.tiltSensitivity
      gyroAcceleration.y = tiltDirectionY * tiltMagnitude * GYRO_LIQUID_CONFIG.tiltSensitivity
    }
    
    function updateGyroscopePhysics() {
      if (!useGyro || !gyroCalibrated) return
      
      const dx = gyroTarget.x - gyroPosition.x
      const dy = gyroTarget.y - gyroPosition.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      
      const springForceX = dx * GYRO_LIQUID_CONFIG.springStrength
      const springForceY = dy * GYRO_LIQUID_CONFIG.springStrength
      
      gyroVelocity.x += gyroAcceleration.x + springForceX
      gyroVelocity.y += gyroAcceleration.y + springForceY
      
      gyroVelocity.x *= GYRO_LIQUID_CONFIG.damping
      gyroVelocity.y *= GYRO_LIQUID_CONFIG.damping
      
      const velMag = Math.sqrt(gyroVelocity.x * gyroVelocity.x + gyroVelocity.y * gyroVelocity.y)
      if (velMag > GYRO_LIQUID_CONFIG.maxVelocity) {
        gyroVelocity.x = (gyroVelocity.x / velMag) * GYRO_LIQUID_CONFIG.maxVelocity
        gyroVelocity.y = (gyroVelocity.y / velMag) * GYRO_LIQUID_CONFIG.maxVelocity
      }
      
      gyroPosition.x += gyroVelocity.x
      gyroPosition.y += gyroVelocity.y
      
      // Use the render loop's synchronized time variable instead of Date.now()
      const oscillationTime = time * GYRO_LIQUID_CONFIG.waveFrequency
      const oscillationX = Math.sin(oscillationTime + gyroPosition.x * 0.01) * GYRO_LIQUID_CONFIG.waveAmplitude
      const oscillationY = Math.cos(oscillationTime + gyroPosition.y * 0.01) * GYRO_LIQUID_CONFIG.waveAmplitude
      
      const oscillationDamping = 1 - Math.min(velMag / GYRO_LIQUID_CONFIG.maxVelocity, 0.7)
      gyroPosition.x += oscillationX * oscillationDamping
      gyroPosition.y += oscillationY * oscillationDamping
      
      gyroPosition.x = Math.max(0, Math.min(width, gyroPosition.x))
      gyroPosition.y = Math.max(0, Math.min(height, gyroPosition.y))
      
      gyroTarget.x = gyroPosition.x
      gyroTarget.y = gyroPosition.y
      
      updateDevMode()
    }

    // Event Handlers
    function handleMouseMove(e) {
      if (!useGyro) {
        targetMouse.x = e.clientX
        targetMouse.y = e.clientY
      }
    }

    function handleMouseLeave() {
      if (!useGyro) {
        targetMouse.x = -1000
        targetMouse.y = -1000
      }
    }

    function handleTouchMove(e) {
      if (!useGyro && e.touches.length > 0) {
        targetMouse.x = e.touches[0].clientX
        targetMouse.y = e.touches[0].clientY
      }
    }

    function handleTouchEnd() {
      if (!useGyro) {
        targetMouse.x = -1000
        targetMouse.y = -1000
      }
    }

    // Initialization
    window.addEventListener('resize', resize)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseleave', handleMouseLeave)
    window.addEventListener('touchmove', handleTouchMove, { passive: true })
    window.addEventListener('touchend', handleTouchEnd)
    window.addEventListener('deviceorientation', handleDeviceOrientation, { passive: true })
    
    // Gyroscope button setup
    const gyroBtn = document.getElementById('gyroBtn')
    const gyroControl = document.querySelector('.gyro-control')
    
    // Store interval reference for cleanup
    let statusCheckInterval = null
    
    if (gyroBtn) {
      gyroBtn.addEventListener('click', () => {
        if (!gyroEnabled) {
          requestGyroPermission()
          gyroBtn.textContent = 'Validating...'
          gyroBtn.disabled = true
        } else {
          useGyro = !useGyro
          gyroBtn.classList.toggle('active', useGyro)
          gyroBtn.textContent = useGyro ? 'Disable Gyroscope' : 'Enable Gyroscope'
          
          if (!useGyro) {
            targetMouse.x = -1000
            targetMouse.y = -1000
          }
        }
      })
      
      const checkGyroStatus = () => {
        if (gyroEnabled && gyroCalibrated && gyroValidated) {
          if (!useGyro) {
            useGyro = true
          }
          gyroBtn.disabled = false
          gyroBtn.textContent = useGyro ? 'Disable Gyroscope' : 'Enable Gyroscope'
          gyroBtn.classList.toggle('active', useGyro)
          if (gyroControl) {
            gyroControl.style.display = 'none'
          }
        } else if (gyroEnabled && gyroCalibrated && !gyroValidated) {
          gyroBtn.textContent = 'Validating...'
        }
      }
      
      statusCheckInterval = setInterval(() => {
        if (gyroEnabled && gyroCalibrated) {
          checkGyroStatus()
          if (gyroValidated) {
            clearInterval(statusCheckInterval)
            statusCheckInterval = null
          }
        }
      }, 100)
    }
    
    function autoEnableGyroscope() {
      if (typeof DeviceOrientationEvent !== 'undefined') {
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                         (window.matchMedia && window.matchMedia('(hover: none) and (pointer: coarse)').matches)
        
        if (isMobile) {
          const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent)
          
          if (isIOS && typeof DeviceOrientationEvent.requestPermission === 'function') {
            console.log('iOS detected - gyroscope will auto-enable when permission is granted')
          } else {
            setTimeout(() => {
              enableGyroscope(true)
            }, 100)
          }
        }
      }
    }
    
    autoEnableGyroscope()
    resize()
    animationFrameRef.current = requestAnimationFrame(render)

    // Cleanup
    return () => {
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseleave', handleMouseLeave)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleTouchEnd)
      window.removeEventListener('deviceorientation', handleDeviceOrientation)
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      
      // Clear status check interval to prevent memory leak
      if (statusCheckInterval) {
        clearInterval(statusCheckInterval)
        statusCheckInterval = null
      }
    }
  }, [])

  return (
    <div ref={containerRef} className="line-field-container">
      <canvas ref={canvasRef} className="line-field-canvas" />
      <div className="gyro-control">
        <button id="gyroBtn" className="gyro-btn">Enable Gyroscope</button>
      </div>
      <div id="devMode" className="dev-mode active">
        <h3>Gyroscope Dev Mode</h3>
        <div className="dev-row">
          <span className="dev-label">Alpha:</span>
          <span className="dev-value" id="devAlpha">0.00°</span>
        </div>
        <div className="dev-row">
          <span className="dev-label">Beta:</span>
          <span className="dev-value" id="devBeta">0.00°</span>
        </div>
        <div className="dev-row">
          <span className="dev-label">Gamma:</span>
          <span className="dev-value" id="devGamma">0.00°</span>
        </div>
        <div className="dev-section">
          <div className="dev-row">
            <span className="dev-label">Δ Alpha:</span>
            <span className="dev-value" id="devDeltaAlpha">0.00°</span>
          </div>
          <div className="dev-row">
            <span className="dev-label">Δ Beta:</span>
            <span className="dev-value" id="devDeltaBeta">0.00°</span>
          </div>
          <div className="dev-row">
            <span className="dev-label">Δ Gamma:</span>
            <span className="dev-value" id="devDeltaGamma">0.00°</span>
          </div>
        </div>
        <div className="dev-section">
          <div className="dev-row">
            <span className="dev-label">Position X:</span>
            <span className="dev-value" id="devPosX">0</span>
          </div>
          <div className="dev-row">
            <span className="dev-label">Position Y:</span>
            <span className="dev-value" id="devPosY">0</span>
          </div>
          <div className="dev-row">
            <span className="dev-label">Velocity X:</span>
            <span className="dev-value" id="devVelX">0.00</span>
          </div>
          <div className="dev-row">
            <span className="dev-label">Velocity Y:</span>
            <span className="dev-value" id="devVelY">0.00</span>
          </div>
        </div>
        <div className="dev-section">
          <div className="dev-row">
            <span className="dev-label">Enabled:</span>
            <span className="dev-value" id="devEnabled">false</span>
          </div>
          <div className="dev-row">
            <span className="dev-label">Calibrated:</span>
            <span className="dev-value" id="devCalibrated">false</span>
          </div>
          <div className="dev-row">
            <span className="dev-label">Active:</span>
            <span className="dev-value" id="devActive">false</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LineField




