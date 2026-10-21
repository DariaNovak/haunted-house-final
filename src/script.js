import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { Timer } from 'three/addons/misc/Timer.js'
import { Sky } from 'three/addons/objects/Sky.js'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import GUI from 'lil-gui'

/**
 * Base
 */
// Debug
const gui = new GUI({ title: 'Налаштування сцени', width: 320 })

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

// Seeded random, щоб розташування могил, каміння та дерев було однаковим при кожному запуску
let seed = 1337
const random = () =>
{
    seed |= 0
    seed = seed + 0x6D2B79F5 | 0
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
}
const randomRange = (min, max) => min + random() * (max - min)

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
const maxAnisotropy = renderer.capabilities.getMaxAnisotropy()

/**
 * Camera
 */
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.set(4.5, 2.5, 7.5)
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true
controls.target.set(0, 1, 0)
controls.maxDistance = 18
controls.minDistance = 2
controls.maxPolarAngle = Math.PI / 2 - 0.05

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Loading
 */
const intro = document.querySelector('.intro')
const introPercent = document.querySelector('.intro-percent')
const introProgress = document.querySelector('.intro-progress')
const introButtons = document.querySelectorAll('.intro-enter')

const loadingManager = new THREE.LoadingManager()
loadingManager.onProgress = (url, loaded, total) =>
{
    introPercent.textContent = `${Math.round(loaded / total * 100)}%`
}
loadingManager.onLoad = () =>
{
    introProgress.textContent = 'Садиба чекає на вас.'
    introButtons.forEach((button) => button.disabled = false)
}

/**
 * Textures
 */
const textureLoader = new THREE.TextureLoader(loadingManager)

const loadTexture = (path, { color = false, repeat = null } = {}) =>
{
    const texture = textureLoader.load(path)
    if(color)
        texture.colorSpace = THREE.SRGBColorSpace
    if(repeat)
    {
        texture.repeat.set(repeat[0], repeat[1])
        texture.wrapS = THREE.RepeatWrapping
        texture.wrapT = THREE.RepeatWrapping
    }
    texture.anisotropy = maxAnisotropy
    return texture
}

const textureSettings = {
    floorRepeat: 12,
    wallRepeat: 1,
    roofRepeat: 3,
    graveRepeat: 0.3
}

// Floor
const floorAlphaTexture = loadTexture('./floor/alpha.webp')
const floorColorTexture = loadTexture('./floor/coast_sand_rocks_02_1k/coast_sand_rocks_02_diff_1k.webp', { color: true, repeat: [12, 12] })
const floorARMTexture = loadTexture('./floor/coast_sand_rocks_02_1k/coast_sand_rocks_02_arm_1k.webp', { repeat: [12, 12] })
const floorNormalTexture = loadTexture('./floor/coast_sand_rocks_02_1k/coast_sand_rocks_02_nor_gl_1k.webp', { repeat: [12, 12] })
const floorDisplacementTexture = loadTexture('./floor/coast_sand_rocks_02_1k/coast_sand_rocks_02_disp_1k.webp', { repeat: [12, 12] })
const floorTextures = [floorColorTexture, floorARMTexture, floorNormalTexture, floorDisplacementTexture]

// Wall
const wallColorTexture = loadTexture('./wall/castle_brick_broken_06_1k/castle_brick_broken_06_diff_1k.webp', { color: true, repeat: [1, 1] })
const wallARMTexture = loadTexture('./wall/castle_brick_broken_06_1k/castle_brick_broken_06_arm_1k.webp', { repeat: [1, 1] })
const wallNormalTexture = loadTexture('./wall/castle_brick_broken_06_1k/castle_brick_broken_06_nor_gl_1k.webp', { repeat: [1, 1] })
const wallTextures = [wallColorTexture, wallARMTexture, wallNormalTexture]

// Roof
const roofColorTexture = loadTexture('./roof/roof_slates_02_1k/roof_slates_02_diff_1k.webp', { color: true, repeat: [3, 1] })
const roofARMTexture = loadTexture('./roof/roof_slates_02_1k/roof_slates_02_arm_1k.webp', { repeat: [3, 1] })
const roofNormalTexture = loadTexture('./roof/roof_slates_02_1k/roof_slates_02_nor_gl_1k.webp', { repeat: [3, 1] })
const roofTextures = [roofColorTexture, roofARMTexture, roofNormalTexture]

// Bush
const bushColorTexture = loadTexture('./bush/leaves_forest_ground_1k/leaves_forest_ground_diff_1k.webp', { color: true, repeat: [2, 1] })
const bushARMTexture = loadTexture('./bush/leaves_forest_ground_1k/leaves_forest_ground_arm_1k.webp', { repeat: [2, 1] })
const bushNormalTexture = loadTexture('./bush/leaves_forest_ground_1k/leaves_forest_ground_nor_gl_1k.webp', { repeat: [2, 1] })

// Grave / stone
const graveColorTexture = loadTexture('./grave/plastered_stone_wall_1k/plastered_stone_wall_diff_1k.webp', { color: true, repeat: [0.3, 0.4] })
const graveARMTexture = loadTexture('./grave/plastered_stone_wall_1k/plastered_stone_wall_arm_1k.webp', { repeat: [0.3, 0.4] })
const graveNormalTexture = loadTexture('./grave/plastered_stone_wall_1k/plastered_stone_wall_nor_gl_1k.webp', { repeat: [0.3, 0.4] })
const graveTextures = [graveColorTexture, graveARMTexture, graveNormalTexture]

// Door
const doorColorTexture = loadTexture('./door/color.webp', { color: true })
const doorAlphaTexture = loadTexture('./door/alpha.webp')
const doorAmbientOcclusionTexture = loadTexture('./door/ambientOcclusion.webp')
const doorHeightTexture = loadTexture('./door/height.webp')
const doorNormalTexture = loadTexture('./door/normal.webp')
const doorMetalnessTexture = loadTexture('./door/metalness.webp')
const doorRoughnessTexture = loadTexture('./door/roughness.webp')

/**
 * Procedural (canvas) textures: дерев'яні дошки, таблички, двері вбиральні, світлячки
 */
const makeCanvasTexture = (canvasElement, repeat = [1, 1]) =>
{
    const texture = new THREE.CanvasTexture(canvasElement)
    texture.colorSpace = THREE.SRGBColorSpace
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    texture.repeat.set(repeat[0], repeat[1])
    texture.anisotropy = maxAnisotropy
    return texture
}

const drawPlanks = (context, size, { planks = 6, base = '#5a3d26', vertical = false } = {}) =>
{
    context.save()
    if(vertical)
    {
        context.translate(size, 0)
        context.rotate(Math.PI / 2)
    }

    const plankSize = size / planks
    const baseColor = new THREE.Color(base)

    for(let i = 0; i < planks; i++)
    {
        const plankColor = baseColor.clone().offsetHSL(0, randomRange(-0.03, 0.03), randomRange(-0.05, 0.05))
        context.fillStyle = `#${plankColor.getHexString()}`
        context.fillRect(0, i * plankSize, size, plankSize)

        // Grain
        for(let k = 0; k < 16; k++)
        {
            context.strokeStyle = `rgba(0, 0, 0, ${randomRange(0.06, 0.22)})`
            context.lineWidth = randomRange(0.8, 2.2)
            context.beginPath()
            const y = i * plankSize + random() * plankSize
            const waviness = randomRange(0.5, 3)
            const phase = random() * 10
            context.moveTo(0, y)
            for(let x = 0; x <= size; x += 16)
                context.lineTo(x, y + Math.sin(x * 0.015 + phase) * waviness)
            context.stroke()
        }

        // Knot
        if(random() < 0.5)
        {
            context.fillStyle = 'rgba(30, 15, 5, 0.55)'
            context.beginPath()
            context.ellipse(random() * size, i * plankSize + plankSize * 0.5, randomRange(6, 14), randomRange(3, 6), 0, 0, Math.PI * 2)
            context.fill()
        }

        // Gap between planks
        context.fillStyle = 'rgba(0, 0, 0, 0.7)'
        context.fillRect(0, i * plankSize, size, 3)

        // Nails
        context.fillStyle = 'rgba(40, 40, 40, 0.9)'
        for(const x of [size * 0.06, size * 0.94])
        {
            context.beginPath()
            context.arc(x, i * plankSize + plankSize * 0.5, 3, 0, Math.PI * 2)
            context.fill()
        }
    }
    context.restore()
}

const createCanvas = (width, height) =>
{
    const element = document.createElement('canvas')
    element.width = width
    element.height = height
    return { element, context: element.getContext('2d') }
}

const createWoodTexture = (options, repeat) =>
{
    const { element, context } = createCanvas(512, 512)
    drawPlanks(context, 512, options)
    return makeCanvasTexture(element, repeat)
}

const createSignTexture = (lines) =>
{
    const { element, context } = createCanvas(512, 256)
    drawPlanks(context, 512, { planks: 3, base: '#7a5a3a' })
    context.fillStyle = '#4a0606'
    context.textAlign = 'center'
    context.textBaseline = 'middle'
    context.font = 'bold 64px Georgia, serif'
    lines.forEach((line, index) =>
    {
        const y = 128 + (index - (lines.length - 1) / 2) * 76
        context.fillText(line, 256, y)
    })
    return makeCanvasTexture(element)
}

const createOuthouseDoorTexture = () =>
{
    const { element, context } = createCanvas(256, 512)
    drawPlanks(context, 512, { planks: 4, base: '#6b4a2e', vertical: true })

    // Вирізаний півмісяць, класика сільської вбиральні
    const cx = 128
    const cy = 90
    const radius = 34
    context.save()
    context.beginPath()
    context.arc(cx, cy, radius, 0, Math.PI * 2)
    context.clip()
    context.beginPath()
    context.rect(0, 0, 256, 512)
    context.arc(cx + radius * 0.5, cy - radius * 0.2, radius * 0.9, 0, Math.PI * 2)
    context.fillStyle = '#0a0503'
    context.fill('evenodd')
    context.restore()
    return makeCanvasTexture(element)
}

const createGlowTexture = () =>
{
    const { element, context } = createCanvas(64, 64)
    const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32)
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)')
    gradient.addColorStop(0.25, 'rgba(255, 255, 255, 0.6)')
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
    context.fillStyle = gradient
    context.fillRect(0, 0, 64, 64)
    const texture = new THREE.CanvasTexture(element)
    return texture
}

const woodTexture = createWoodTexture({ planks: 6, base: '#5e4128', vertical: true }, [2, 1])
const darkWoodTexture = createWoodTexture({ planks: 5, base: '#3d2a1a', vertical: true })
const fenceWoodTexture = createWoodTexture({ planks: 3, base: '#4a3a2c', vertical: true })

/**
 * Materials
 */
const wallMaterial = new THREE.MeshStandardMaterial({
    map: wallColorTexture,
    aoMap: wallARMTexture,
    roughnessMap: wallARMTexture,
    metalnessMap: wallARMTexture,
    normalMap: wallNormalTexture
})

const roofMaterial = new THREE.MeshStandardMaterial({
    map: roofColorTexture,
    aoMap: roofARMTexture,
    roughnessMap: roofARMTexture,
    metalnessMap: roofARMTexture,
    normalMap: roofNormalTexture
})

const stoneMaterial = new THREE.MeshStandardMaterial({
    map: graveColorTexture,
    aoMap: graveARMTexture,
    roughnessMap: graveARMTexture,
    metalnessMap: graveARMTexture,
    normalMap: graveNormalTexture
})

const bushMaterial = new THREE.MeshStandardMaterial({
    color: '#ccffcc',
    map: bushColorTexture,
    aoMap: bushARMTexture,
    roughnessMap: bushARMTexture,
    metalnessMap: bushARMTexture,
    normalMap: bushNormalTexture
})

const woodMaterial = new THREE.MeshStandardMaterial({ map: woodTexture, roughness: 0.9 })
const darkWoodMaterial = new THREE.MeshStandardMaterial({ map: darkWoodTexture, roughness: 0.95 })
const fenceMaterial = new THREE.MeshStandardMaterial({ map: fenceWoodTexture, roughness: 1 })
const barkMaterial = new THREE.MeshStandardMaterial({ color: '#2a1f17', roughness: 1, flatShading: true })
const ironMaterial = new THREE.MeshStandardMaterial({ color: '#1c1c1c', metalness: 0.8, roughness: 0.45 })

const windowGlassMaterial = new THREE.MeshStandardMaterial({
    color: '#000000',
    emissive: '#ff9a3c',
    emissiveIntensity: 1.2
})

const lanternGlassMaterial = new THREE.MeshStandardMaterial({
    color: '#000000',
    emissive: '#ff7d46',
    emissiveIntensity: 2
})

/**
 * Floor
 */
const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(30, 30, 150, 150),
    new THREE.MeshStandardMaterial({
        alphaMap: floorAlphaTexture,
        transparent: true,
        map: floorColorTexture,
        aoMap: floorARMTexture,
        roughnessMap: floorARMTexture,
        metalnessMap: floorARMTexture,
        normalMap: floorNormalTexture,
        displacementMap: floorDisplacementTexture,
        displacementScale: 0.3,
        displacementBias: -0.2
    })
)
floor.rotation.x = - Math.PI * 0.5
floor.userData.receiveOnly = true
scene.add(floor)

/**
 * House
 */
const house = new THREE.Group()
scene.add(house)

// Walls
const walls = new THREE.Mesh(new THREE.BoxGeometry(4, 2.5, 4), wallMaterial)
walls.position.y = 1.25
house.add(walls)

// Roof
const roof = new THREE.Mesh(new THREE.ConeGeometry(3.5, 1.5, 4), roofMaterial)
roof.position.y = 2.5 + 0.75
roof.rotation.y = Math.PI * 0.25
house.add(roof)

// Chimney
const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.4, 0.5), wallMaterial)
chimney.position.set(0.9, 3.5, -0.7)
house.add(chimney)

// Door
const door = new THREE.Mesh(
    new THREE.PlaneGeometry(2.2, 2.2, 100, 100),
    new THREE.MeshStandardMaterial({
        map: doorColorTexture,
        transparent: true,
        alphaMap: doorAlphaTexture,
        aoMap: doorAmbientOcclusionTexture,
        displacementMap: doorHeightTexture,
        displacementScale: 0.15,
        displacementBias: -0.04,
        normalMap: doorNormalTexture,
        metalnessMap: doorMetalnessTexture,
        roughnessMap: doorRoughnessTexture
    })
)
door.position.y = 1
door.position.z = 2 + 0.01
house.add(door)

// Porch step
const porch = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.16, 0.9), stoneMaterial)
porch.position.set(0, 0.04, 2.45)
house.add(porch)

// Lantern above the door
const lantern = new THREE.Group()
lantern.position.set(0, 2.25, 2.12)
house.add(lantern)

const lanternGlass = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.22, 0.16), lanternGlassMaterial)
lanternGlass.userData.noShadow = true
lantern.add(lanternGlass)

const lanternCap = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.12, 4), ironMaterial)
lanternCap.position.y = 0.17
lanternCap.rotation.y = Math.PI * 0.25
lantern.add(lanternCap)

// Windows (рамка + ґрати + скло, що світиться)
const createWindow = (width, height) =>
{
    const group = new THREE.Group()

    const frame = new THREE.Mesh(new THREE.BoxGeometry(width + 0.16, height + 0.16, 0.06), darkWoodMaterial)
    group.add(frame)

    const glass = new THREE.Mesh(new THREE.PlaneGeometry(width, height), windowGlassMaterial)
    glass.position.z = 0.035
    glass.userData.noShadow = true
    group.add(glass)

    const barVertical = new THREE.Mesh(new THREE.BoxGeometry(0.05, height, 0.04), darkWoodMaterial)
    barVertical.position.z = 0.05
    const barHorizontal = new THREE.Mesh(new THREE.BoxGeometry(width, 0.05, 0.04), darkWoodMaterial)
    barHorizontal.position.z = 0.05
    group.add(barVertical, barHorizontal)

    // Перекошена дошка, якою забили вікно
    const board = new THREE.Mesh(new THREE.BoxGeometry(width + 0.3, 0.14, 0.03), woodMaterial)
    board.position.z = 0.08
    board.rotation.z = randomRange(-0.5, 0.5)
    group.add(board)

    return group
}

const windowRight = createWindow(0.8, 1)
windowRight.position.set(2 + 0.03, 1.4, 0.2)
windowRight.rotation.y = Math.PI * 0.5
house.add(windowRight)

const windowLeft = createWindow(0.8, 1)
windowLeft.position.set(- 2 - 0.03, 1.4, - 0.3)
windowLeft.rotation.y = - Math.PI * 0.5
house.add(windowLeft)

const windowBack = createWindow(1.1, 0.7)
windowBack.position.set(0.6, 1.6, - 2 - 0.03)
windowBack.rotation.y = Math.PI
house.add(windowBack)

/**
 * Bushes
 */
const bushGeometry = new THREE.SphereGeometry(1, 16, 16)
const bushes = [
    // Біля дверей, як в оригінальному проєкті
    { position: [0.8, 0.2, 2.2], scale: 0.5 },
    { position: [1.4, 0.1, 2.1], scale: 0.25 },
    { position: [- 0.8, 0.1, 2.2], scale: 0.4 },
    { position: [- 1, 0.05, 2.6], scale: 0.15 },
    // Нові: навколо будинку, сараю та вбиральні
    { position: [2.3, 0.15, - 1.6], scale: 0.45 },
    { position: [- 2.4, 0.1, 1.4], scale: 0.35 },
    { position: [- 3.6, 0.1, - 4.2], scale: 0.55 },
    { position: [5.6, 0.1, - 3.2], scale: 0.4 },
    { position: [- 7.5, 0.1, 1.8], scale: 0.6 },
    { position: [6.8, 0.1, 3.8], scale: 0.5 },
    { position: [- 2.2, 0.05, 7.6], scale: 0.45 }
]
for(const bushData of bushes)
{
    const bush = new THREE.Mesh(bushGeometry, bushMaterial)
    bush.position.set(...bushData.position)
    bush.scale.setScalar(bushData.scale)
    bush.rotation.x = - 0.75
    scene.add(bush)
}

/**
 * Shed (сарай) — двосхилий дах, дерев'яні стіни, рипучі двері
 */
const shed = new THREE.Group()
shed.position.set(- 5.4, 0, - 2.6)
shed.rotation.y = 0.35
scene.add(shed)

const shedWidth = 3
const shedDepth = 3.6
const shedHeight = 2
const shedRoofHeight = 1.1

const shedWalls = new THREE.Mesh(new THREE.BoxGeometry(shedWidth, shedHeight, shedDepth), woodMaterial)
shedWalls.position.y = shedHeight * 0.5
shed.add(shedWalls)

// Gables (трикутні фронтони)
const gableShape = new THREE.Shape()
gableShape.moveTo(- shedWidth * 0.5, 0)
gableShape.lineTo(shedWidth * 0.5, 0)
gableShape.lineTo(0, shedRoofHeight)
gableShape.closePath()
const gableGeometry = new THREE.ShapeGeometry(gableShape)

const gableFront = new THREE.Mesh(gableGeometry, woodMaterial)
gableFront.position.set(0, shedHeight, shedDepth * 0.5)
const gableBack = new THREE.Mesh(gableGeometry, woodMaterial)
gableBack.position.set(0, shedHeight, - shedDepth * 0.5)
gableBack.rotation.y = Math.PI
shed.add(gableFront, gableBack)

// Roof slopes
const slopeAngle = Math.atan2(shedRoofHeight, shedWidth * 0.5)
const slopeLength = Math.hypot(shedRoofHeight, shedWidth * 0.5) + 0.25
const slopeGeometry = new THREE.BoxGeometry(slopeLength, 0.08, shedDepth + 0.4)
for(const side of [- 1, 1])
{
    const slope = new THREE.Mesh(slopeGeometry, roofMaterial)
    slope.position.set(side * shedWidth * 0.25, shedHeight + shedRoofHeight * 0.5 + 0.04, 0)
    slope.rotation.z = - side * slopeAngle
    shed.add(slope)
}

// Shed door on a hinge (анімується)
const shedDoorHinge = new THREE.Group()
shedDoorHinge.position.set(- 0.7, 0, shedDepth * 0.5 + 0.03)
shed.add(shedDoorHinge)

const shedDoor = new THREE.Group()
shedDoor.position.x = 0.7
shedDoorHinge.add(shedDoor)

const shedDoorPanel = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.75, 0.05), darkWoodMaterial)
shedDoorPanel.position.y = 0.9
shedDoor.add(shedDoorPanel)

for(const y of [0.35, 1.45])
{
    const brace = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.12, 0.04), woodMaterial)
    brace.position.set(0, y, 0.04)
    shedDoor.add(brace)
}
const diagonalBrace = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.12, 0.04), woodMaterial)
diagonalBrace.position.set(0, 0.9, 0.04)
diagonalBrace.rotation.z = Math.atan2(1.1, 1.4)
shedDoor.add(diagonalBrace)

// Dark interior behind the door
const shedInterior = new THREE.Mesh(
    new THREE.PlaneGeometry(1.4, 1.75),
    new THREE.MeshBasicMaterial({ color: '#050302' })
)
shedInterior.position.set(0, 0.9, shedDepth * 0.5 + 0.01)
shedInterior.userData.noShadow = true
shed.add(shedInterior)

// Small side window
const shedWindow = createWindow(0.6, 0.5)
shedWindow.position.set(shedWidth * 0.5 + 0.03, 1.3, 0)
shedWindow.rotation.y = Math.PI * 0.5
shed.add(shedWindow)

/**
 * Outhouse (вбиральня на задньому дворі)
 */
const outhouse = new THREE.Group()
outhouse.position.set(4.8, 0, - 4.4)
outhouse.rotation.y = - 0.6
outhouse.rotation.z = 0.04
scene.add(outhouse)

const outhouseBody = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.1, 1.2), woodMaterial)
outhouseBody.position.y = 1.05
outhouse.add(outhouseBody)

const outhouseRoof = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.08, 1.6), darkWoodMaterial)
outhouseRoof.position.set(0, 2.2, 0)
outhouseRoof.rotation.x = 0.22
outhouse.add(outhouseRoof)

const outhouseDoor = new THREE.Mesh(
    new THREE.PlaneGeometry(0.9, 1.8),
    new THREE.MeshStandardMaterial({ map: createOuthouseDoorTexture(), roughness: 0.9 })
)
outhouseDoor.position.set(0, 0.95, 0.605)
outhouse.add(outhouseDoor)

/**
 * Wooden signs (дерев'яні таблички)
 */
const createSign = (lines, position, rotationY, tilt) =>
{
    const sign = new THREE.Group()
    sign.position.set(...position)
    sign.rotation.y = rotationY
    sign.rotation.z = tilt
    scene.add(sign)

    const post = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.5, 0.1), darkWoodMaterial)
    post.position.y = 0.65
    sign.add(post)

    const boardMaterial = new THREE.MeshStandardMaterial({ map: createSignTexture(lines), roughness: 0.9 })
    const board = new THREE.Mesh(
        new THREE.BoxGeometry(1.3, 0.65, 0.05),
        [darkWoodMaterial, darkWoodMaterial, darkWoodMaterial, darkWoodMaterial, boardMaterial, darkWoodMaterial]
    )
    board.position.set(0, 1.2, 0.08)
    sign.add(board)
    return sign
}

createSign(['НЕ ВХОДЬ!'], [1.9, 0, 8.4], - 0.25, 0.08)
createSign(['ОБЕРЕЖНО:', 'ПРИВИДИ'], [- 1.6, 0, 5.2], 0.4, - 0.06)
createSign(['ВБИРАЛЬНЯ', '→'], [3, 0, - 1.6], - 1.1, 0.03)

/**
 * Instanced helpers
 */
const dummy = new THREE.Object3D()
const createInstanced = (geometry, material, transforms) =>
{
    const mesh = new THREE.InstancedMesh(geometry, material, transforms.length)
    transforms.forEach((transform, index) =>
    {
        dummy.position.set(...transform.position)
        dummy.rotation.set(...(transform.rotation ?? [0, 0, 0]))
        dummy.scale.set(...(transform.scale ?? [1, 1, 1]))
        dummy.updateMatrix()
        mesh.setMatrixAt(index, dummy.matrix)
    })
    mesh.instanceMatrix.needsUpdate = true
    mesh.computeBoundingSphere()
    scene.add(mesh)
    return mesh
}

/**
 * Fence (круглий паркан з хвірткою спереду)
 */
const fenceRadius = 9.2
const gateHalfAngle = 0.13
const isInGate = (angle) => Math.abs(Math.atan2(Math.sin(angle), Math.cos(angle))) < gateHalfAngle

const fencePosts = []
const fenceRails = []
const fencePickets = []

const postCount = 46
for(let i = 0; i < postCount; i++)
{
    const angle = i / postCount * Math.PI * 2
    const nextAngle = (i + 1) / postCount * Math.PI * 2
    if(isInGate(angle))
        continue

    fencePosts.push({
        position: [Math.sin(angle) * fenceRadius, 0.55, Math.cos(angle) * fenceRadius],
        rotation: [randomRange(- 0.06, 0.06), angle, randomRange(- 0.06, 0.06)]
    })

    // Rails between this post and the next one
    if(isInGate(nextAngle) || isInGate((angle + nextAngle) * 0.5))
        continue

    const midAngle = (angle + nextAngle) * 0.5
    const chord = 2 * fenceRadius * Math.sin(Math.PI / postCount)
    for(const y of [0.35, 0.85])
    {
        // Деякі поперечини зламані й відсутні
        if(random() < 0.1)
            continue
        fenceRails.push({
            position: [Math.sin(midAngle) * fenceRadius * 0.995, y, Math.cos(midAngle) * fenceRadius * 0.995],
            rotation: [0, midAngle, randomRange(- 0.04, 0.04)],
            scale: [chord, 1, 1]
        })
    }

    // Pickets
    for(let p = 1; p < 4; p++)
    {
        if(random() < 0.15)
            continue
        const pickedAngle = angle + (nextAngle - angle) * p / 4
        const height = randomRange(0.8, 1.15)
        fencePickets.push({
            position: [Math.sin(pickedAngle) * (fenceRadius + 0.05), height * 0.5, Math.cos(pickedAngle) * (fenceRadius + 0.05)],
            rotation: [randomRange(- 0.12, 0.12), pickedAngle, randomRange(- 0.15, 0.15)],
            scale: [1, height, 1]
        })
    }
}

createInstanced(new THREE.BoxGeometry(0.14, 1.3, 0.14), darkWoodMaterial, fencePosts)
createInstanced(new THREE.BoxGeometry(1, 0.08, 0.04), fenceMaterial, fenceRails)
createInstanced(new THREE.BoxGeometry(0.1, 1, 0.03), fenceMaterial, fencePickets)

// Gate posts with lanterns-less iron arch
for(const side of [- 1, 1])
{
    const angle = side * gateHalfAngle
    const gatePost = new THREE.Mesh(new THREE.BoxGeometry(0.22, 1.7, 0.22), stoneMaterial)
    gatePost.position.set(Math.sin(angle) * fenceRadius, 0.8, Math.cos(angle) * fenceRadius)
    scene.add(gatePost)
}
const gateArch = new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.04, 8, 32, Math.PI), ironMaterial)
gateArch.position.set(0, 1.6, fenceRadius - 0.08)
gateArch.scale.y = 0.45
scene.add(gateArch)

/**
 * Path (кам'яна доріжка від хвіртки до дверей)
 */
const pathStones = []
for(let z = 3.2; z < fenceRadius - 0.3; z += randomRange(0.65, 0.8))
{
    pathStones.push({
        position: [randomRange(- 0.25, 0.25) + Math.sin(z * 0.6) * 0.3, - 0.02, z],
        rotation: [0, random() * Math.PI, 0],
        scale: [randomRange(0.8, 1.15), 1, randomRange(0.75, 1)]
    })
}
const pathMesh = createInstanced(new THREE.CylinderGeometry(0.34, 0.38, 0.1, 9), stoneMaterial, pathStones)
pathMesh.userData.receiveOnly = true

/**
 * Placement helper: вільне місце на ділянці
 */
const obstacles = [
    { x: 0, z: 0, radius: 3.4 },           // будинок
    { x: - 5.4, z: - 2.6, radius: 2.8 },   // сарай
    { x: 4.8, z: - 4.4, radius: 1.4 },     // вбиральня
    { x: 6.2, z: 1.2, radius: 1 },         // дерево
    { x: - 6.6, z: 4, radius: 1 },         // дерево
    { x: - 3.9, z: 7.2, radius: 1 },        // дерево
    { x: 1.9, z: 8.4, radius: 0.7 },       // табличка
    { x: - 1.6, z: 5.2, radius: 0.7 },     // табличка
    { x: 3, z: - 1.6, radius: 0.7 }        // табличка
]
const isFree = (x, z, padding = 0.4) =>
{
    if(Math.abs(x) < 1.3 && z > 2)
        return false // доріжка
    for(const obstacle of obstacles)
        if(Math.hypot(x - obstacle.x, z - obstacle.z) < obstacle.radius + padding)
            return false
    return true
}
const findFreeSpot = (minRadius, maxRadius, padding) =>
{
    for(let attempt = 0; attempt < 200; attempt++)
    {
        const angle = random() * Math.PI * 2
        const radius = randomRange(minRadius, maxRadius)
        const x = Math.sin(angle) * radius
        const z = Math.cos(angle) * radius
        if(isFree(x, z, padding))
        {
            obstacles.push({ x, z, radius: padding })
            return { x, z }
        }
    }
    return null
}

/**
 * Graves
 */
const graves = []
for(let i = 0; i < 34; i++)
{
    const spot = findFreeSpot(3.6, 8.3, 0.35)
    if(!spot)
        break
    graves.push({
        position: [spot.x, random() * 0.4, spot.z],
        rotation: [(random() - 0.5) * 0.4, (random() - 0.5) * 0.4, (random() - 0.5) * 0.4]
    })
}
createInstanced(new THREE.BoxGeometry(0.6, 0.8, 0.2), stoneMaterial, graves)

// Crosses
const crossGeometry = mergeGeometries([
    new THREE.BoxGeometry(0.12, 1, 0.12),
    new THREE.BoxGeometry(0.55, 0.12, 0.12).translate(0, 0.2, 0)
])
const crosses = []
for(let i = 0; i < 8; i++)
{
    const spot = findFreeSpot(4, 8.3, 0.35)
    if(!spot)
        break
    crosses.push({
        position: [spot.x, 0.35, spot.z],
        rotation: [(random() - 0.5) * 0.3, random() * Math.PI, (random() - 0.5) * 0.3]
    })
}
createInstanced(crossGeometry, stoneMaterial, crosses)

/**
 * Rocks
 */
const rocks = []
for(let i = 0; i < 30; i++)
{
    const spot = findFreeSpot(2.6, 9.5, 0.2)
    if(!spot)
        break
    const size = randomRange(0.08, 0.3)
    rocks.push({
        position: [spot.x, size * 0.2, spot.z],
        rotation: [random() * Math.PI, random() * Math.PI, random() * Math.PI],
        scale: [size * randomRange(0.9, 1.6), size * randomRange(0.5, 0.9), size * randomRange(0.9, 1.4)]
    })
}
createInstanced(new THREE.DodecahedronGeometry(1, 0), stoneMaterial, rocks)

/**
 * Dead trees (рекурсивні гілки, злиті в одну геометрію)
 */
const createTree = (height) =>
{
    const root = new THREE.Object3D()
    const pieces = []

    const addBranch = (parent, length, radius, depth) =>
    {
        const node = new THREE.Object3D()
        parent.add(node)
        const geometry = new THREE.CylinderGeometry(radius * 0.55, radius, length, 6)
        geometry.translate(0, length * 0.5, 0)
        pieces.push({ node, geometry })

        if(depth > 0)
        {
            const childCount = 2 + Math.floor(random() * 2)
            for(let i = 0; i < childCount; i++)
            {
                const child = addBranch(node, length * randomRange(0.55, 0.75), radius * 0.55, depth - 1)
                child.position.y = length * randomRange(0.55, 0.95)
                child.rotation.y = random() * Math.PI * 2
                child.rotation.z = randomRange(0.4, 0.95)
            }
        }
        return node
    }
    addBranch(root, height * 0.45, 0.13, 3)
    root.updateMatrixWorld(true)

    const geometries = pieces.map(({ node, geometry }) => geometry.applyMatrix4(node.matrixWorld))
    return new THREE.Mesh(mergeGeometries(geometries), barkMaterial)
}

for(const [x, z, height, rotation] of [[6.2, 1.2, 4, 0.3], [- 6.6, 4, 4.6, 1.7], [- 3.9, 7.2, 3.4, 2.6]])
{
    const tree = createTree(height)
    tree.position.set(x, - 0.1, z)
    tree.rotation.y = rotation
    scene.add(tree)
}

/**
 * Ghosts (світло + напівпрозоре «простирадло» з очима)
 */
const createGhostGeometry = () =>
{
    const points = []
    const headRadius = 0.36
    const headCenter = 0.14
    for(let i = 0; i <= 12; i++)
    {
        const angle = i / 12 * Math.PI * 0.5
        points.push(new THREE.Vector2(Math.sin(angle) * headRadius, headCenter + Math.cos(angle) * headRadius))
    }
    for(let i = 1; i <= 10; i++)
    {
        const y = headCenter - i / 10 * 0.65
        points.push(new THREE.Vector2(headRadius + i / 10 * 0.12, y))
    }
    const geometry = new THREE.LatheGeometry(points, 40)

    // Хвилястий край простирадла
    const position = geometry.attributes.position
    for(let i = 0; i < position.count; i++)
    {
        const y = position.getY(i)
        if(y < - 0.25)
        {
            const angle = Math.atan2(position.getZ(i), position.getX(i))
            const strength = (- 0.25 - y) / 0.26
            position.setY(i, y + Math.sin(angle * 7) * 0.08 * strength)
        }
    }
    geometry.computeVertexNormals()
    return geometry
}

const ghostGeometry = createGhostGeometry()
const ghostEyeGeometry = new THREE.SphereGeometry(0.05, 12, 12)
const ghostEyeMaterial = new THREE.MeshBasicMaterial({ color: '#000000' })

const ghostSettings = {
    speed: 1,
    radius: 1,
    intensity: 6,
    bodies: true,
    opacity: 0.45,
    shadows: true
}

const ghosts = [
    { color: '#8800ff', speed: 0.5, radius: 4, height: 1 },
    { color: '#ff0088', speed: - 0.38, radius: 5, height: 1 },
    { color: '#ff0000', speed: 0.23, radius: 6.5, height: 1 }
].map((data) =>
{
    const group = new THREE.Group()
    scene.add(group)

    const light = new THREE.PointLight(data.color, ghostSettings.intensity)
    group.add(light)

    const bodyMaterial = new THREE.MeshStandardMaterial({
        color: '#ffffff',
        emissive: data.color,
        emissiveIntensity: 0.7,
        transparent: true,
        opacity: ghostSettings.opacity,
        side: THREE.DoubleSide,
        depthWrite: false
    })
    const body = new THREE.Group()
    group.add(body)

    const sheet = new THREE.Mesh(ghostGeometry, bodyMaterial)
    sheet.userData.noShadow = true
    body.add(sheet)

    for(const side of [- 1, 1])
    {
        const eye = new THREE.Mesh(ghostEyeGeometry, ghostEyeMaterial)
        eye.position.set(side * 0.12, 0.24, 0.32)
        eye.scale.y = 1.4
        eye.userData.noShadow = true
        body.add(eye)
    }

    return { ...data, group, light, body, bodyMaterial, audio: null }
})

/**
 * Fireflies (світлячки)
 */
const fireflyCount = 70
const fireflyBase = new Float32Array(fireflyCount * 3)
const fireflyPhase = new Float32Array(fireflyCount)
for(let i = 0; i < fireflyCount; i++)
{
    const spot = findFreeSpot(3, 8.8, 0)
    fireflyBase[i * 3 + 0] = spot ? spot.x : 0
    fireflyBase[i * 3 + 1] = randomRange(0.25, 2.2)
    fireflyBase[i * 3 + 2] = spot ? spot.z : 0
    fireflyPhase[i] = random() * Math.PI * 2
}
const fireflyGeometry = new THREE.BufferGeometry()
fireflyGeometry.setAttribute('position', new THREE.BufferAttribute(fireflyBase.slice(), 3))
const fireflyMaterial = new THREE.PointsMaterial({
    color: '#c8ff6a',
    size: 0.12,
    map: createGlowTexture(),
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
})
const fireflies = new THREE.Points(fireflyGeometry, fireflyMaterial)
fireflies.userData.noShadow = true
scene.add(fireflies)

/**
 * Lights
 */
// Ambient light
const ambientLight = new THREE.AmbientLight('#86cdff', 0.275)
scene.add(ambientLight)

// Directional light (місяць)
const directionalLight = new THREE.DirectionalLight('#86cdff', 1)
directionalLight.position.set(3, 2, - 8)
scene.add(directionalLight)

// Door light
const doorLight = new THREE.PointLight('#ff7d46', 5)
doorLight.position.set(0, 2.2, 2.5)
house.add(doorLight)

// Lightning
const lightningLight = new THREE.DirectionalLight('#dfe8ff', 0)
lightningLight.position.set(- 6, 10, 6)
scene.add(lightningLight)

const lightSettings = {
    doorIntensity: 5,
    doorFlicker: true,
    doorFlickerStrength: 0.8,
    windowsGlow: 1.2,
    windowsFlicker: true,
    lightning: true,
    lightningIntensity: 4,
    lightningInterval: 12
}

/**
 * Shadows
 */
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap

directionalLight.castShadow = true
directionalLight.shadow.mapSize.set(1024, 1024)
directionalLight.shadow.camera.top = 10
directionalLight.shadow.camera.right = 10
directionalLight.shadow.camera.bottom = - 10
directionalLight.shadow.camera.left = - 10
directionalLight.shadow.camera.near = 1
directionalLight.shadow.camera.far = 22

for(const ghost of ghosts)
{
    ghost.light.castShadow = true
    ghost.light.shadow.mapSize.set(256, 256)
    ghost.light.shadow.camera.far = 10
}

scene.traverse((child) =>
{
    if(!(child.isMesh))
        return
    child.receiveShadow = true
    child.castShadow = !child.userData.noShadow && !child.userData.receiveOnly
    if(child.userData.noShadow)
        child.receiveShadow = false
})

/**
 * Sky
 */
const sky = new Sky()
sky.scale.set(100, 100, 100)
scene.add(sky)

const skySettings = {
    turbidity: 10,
    rayleigh: 3,
    mieCoefficient: 0.1,
    mieDirectionalG: 0.95,
    elevation: - 2.2,
    azimuth: 162.5
}
const sunPosition = new THREE.Vector3()
const updateSky = () =>
{
    const uniforms = sky.material.uniforms
    uniforms.turbidity.value = skySettings.turbidity
    uniforms.rayleigh.value = skySettings.rayleigh
    uniforms.mieCoefficient.value = skySettings.mieCoefficient
    uniforms.mieDirectionalG.value = skySettings.mieDirectionalG

    const phi = THREE.MathUtils.degToRad(90 - skySettings.elevation)
    const theta = THREE.MathUtils.degToRad(skySettings.azimuth)
    sunPosition.setFromSphericalCoords(1, phi, theta)
    uniforms.sunPosition.value.copy(sunPosition)
}
updateSky()

/**
 * Fog
 */
const fogSettings = {
    type: 'FogExp2',
    color: '#04343f',
    density: 0.1,
    near: 1,
    far: 13
}
const fogBaseColor = new THREE.Color(fogSettings.color)
const fogFlashColor = new THREE.Color('#8fa6c8')
const applyFog = () =>
{
    if(fogSettings.type === 'Fog')
        scene.fog = new THREE.Fog(fogBaseColor.clone(), fogSettings.near, fogSettings.far)
    else if(fogSettings.type === 'FogExp2')
        scene.fog = new THREE.FogExp2(fogBaseColor.clone(), fogSettings.density)
    else
        scene.fog = null
}
applyFog()

/**
 * Sounds (генеруються через Web Audio API, без аудіофайлів)
 */
const listener = new THREE.AudioListener()
camera.add(listener)
const audioContext = listener.context

const soundSettings = {
    master: 0.8,
    wind: 0.5,
    ghosts: 0.6,
    thunder: true
}
let soundStarted = false
let windAudio = null
let noiseBuffer = null

const createBrownNoiseBuffer = (duration) =>
{
    const length = audioContext.sampleRate * duration
    const buffer = audioContext.createBuffer(1, length, audioContext.sampleRate)
    const data = buffer.getChannelData(0)
    let last = 0
    for(let i = 0; i < length; i++)
    {
        const white = Math.random() * 2 - 1
        last = (last + 0.02 * white) / 1.02
        data[i] = last * 3.5
    }
    return buffer
}

const createLfo = (frequency, depth, target) =>
{
    const oscillator = audioContext.createOscillator()
    oscillator.frequency.value = frequency
    const gain = audioContext.createGain()
    gain.gain.value = depth
    oscillator.connect(gain).connect(target)
    oscillator.start()
    return oscillator
}

const startSound = () =>
{
    if(soundStarted)
        return
    soundStarted = true
    audioContext.resume()
    listener.setMasterVolume(soundSettings.master)

    noiseBuffer = createBrownNoiseBuffer(5)

    // Wind: шум -> смуговий фільтр, частота і гучність "дихають"
    const windSource = audioContext.createBufferSource()
    windSource.buffer = noiseBuffer
    windSource.loop = true
    const windFilter = audioContext.createBiquadFilter()
    windFilter.type = 'bandpass'
    windFilter.frequency.value = 500
    windFilter.Q.value = 0.9
    const windSwell = audioContext.createGain()
    windSwell.gain.value = 0.55
    createLfo(0.13, 320, windFilter.frequency)
    createLfo(0.07, 0.4, windSwell.gain)
    windSource.connect(windFilter).connect(windSwell)
    windSource.start()

    windAudio = new THREE.Audio(listener)
    windAudio.setNodeSource(windSwell)
    windAudio.setVolume(soundSettings.wind)

    // Ghost moans: позиційний звук, що рухається разом із привидом
    ghosts.forEach((ghost, index) =>
    {
        const oscillator = audioContext.createOscillator()
        oscillator.type = 'sine'
        oscillator.frequency.value = 210 + index * 65
        createLfo(4.5 + index, 7, oscillator.frequency)
        createLfo(0.17 + index * 0.05, 40, oscillator.frequency)

        const amplitude = audioContext.createGain()
        amplitude.gain.value = 0.12
        createLfo(0.21 + index * 0.08, 0.12, amplitude.gain)
        oscillator.connect(amplitude)
        oscillator.start()

        const audio = new THREE.PositionalAudio(listener)
        audio.setNodeSource(amplitude)
        audio.setRefDistance(1.5)
        audio.setRolloffFactor(1.8)
        audio.setVolume(soundSettings.ghosts)
        ghost.group.add(audio)
        ghost.audio = audio
    })
}

const playThunder = (delay) =>
{
    if(!soundStarted || !soundSettings.thunder)
        return
    const startTime = audioContext.currentTime + delay
    const source = audioContext.createBufferSource()
    source.buffer = noiseBuffer
    const filter = audioContext.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(900, startTime)
    filter.frequency.exponentialRampToValueAtTime(120, startTime + 2.5)
    const gain = audioContext.createGain()
    gain.gain.setValueAtTime(0.0001, startTime)
    gain.gain.exponentialRampToValueAtTime(1.6, startTime + 0.06)
    gain.gain.exponentialRampToValueAtTime(0.5, startTime + 0.6)
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 4)
    source.connect(filter).connect(gain).connect(listener.getInput())
    source.start(startTime, Math.random() * 1)
    source.stop(startTime + 4.2)
}

introButtons.forEach((button) =>
{
    button.addEventListener('click', () =>
    {
        if(button.dataset.sound === 'on')
            startSound()
        intro.classList.add('hidden')
    })
})

// Швидкий перегляд без заставки: index.html#nointro
if(location.hash.includes('nointro'))
    intro.classList.add('hidden')

/**
 * Lightning
 */
let lightningStart = - 100
let nextLightning = 8
const triggerLightning = (time) =>
{
    lightningStart = time
    nextLightning = time + lightSettings.lightningInterval * randomRange(0.6, 1.4)
    playThunder(randomRange(0.3, 1.5))
}
const getLightningFlash = (time) =>
{
    const t = time - lightningStart
    if(t < 0 || t > 0.7)
        return 0
    if(t < 0.07) return 1
    if(t < 0.14) return 0.15
    if(t < 0.22) return 0.85
    return (0.7 - t) / 0.48 * 0.35
}

/**
 * GUI
 */
// Sky (як у прикладі three.js webgl_shaders_sky)
const skyFolder = gui.addFolder('Небо (Sky)')
skyFolder.add(skySettings, 'turbidity', 0, 20, 0.1).name('Каламутність').onChange(updateSky)
skyFolder.add(skySettings, 'rayleigh', 0, 4, 0.001).name('Релеївське розсіяння').onChange(updateSky)
skyFolder.add(skySettings, 'mieCoefficient', 0, 0.1, 0.001).name('Коеф. Мі').onChange(updateSky)
skyFolder.add(skySettings, 'mieDirectionalG', 0, 1, 0.001).name('Напрямленість Мі').onChange(updateSky)
skyFolder.add(skySettings, 'elevation', - 10, 90, 0.1).name('Висота сонця, °').onChange(updateSky)
skyFolder.add(skySettings, 'azimuth', - 180, 180, 0.1).name('Азимут, °').onChange(updateSky)
skyFolder.close()

// Fog
const fogFolder = gui.addFolder('Туман (Fog)')
const fogDensityController = fogFolder.add(fogSettings, 'density', 0, 0.3, 0.001).name('Щільність (Exp2)').onChange(() => { if(scene.fog?.isFogExp2) scene.fog.density = fogSettings.density })
const fogNearController = fogFolder.add(fogSettings, 'near', 0, 20, 0.1).name('Початок (Fog)').onChange(() => { if(scene.fog?.isFog) scene.fog.near = fogSettings.near })
const fogFarController = fogFolder.add(fogSettings, 'far', 1, 50, 0.1).name('Кінець (Fog)').onChange(() => { if(scene.fog?.isFog) scene.fog.far = fogSettings.far })
const updateFogControllers = () =>
{
    fogDensityController.show(fogSettings.type === 'FogExp2')
    fogNearController.show(fogSettings.type === 'Fog')
    fogFarController.show(fogSettings.type === 'Fog')
}
fogFolder.add(fogSettings, 'type', { 'Експоненційний (FogExp2)': 'FogExp2', 'Лінійний (Fog)': 'Fog', 'Без туману': 'none' }).name('Тип').onChange(() =>
{
    applyFog()
    updateFogControllers()
})
fogFolder.addColor(fogSettings, 'color').name('Колір').onChange(() => fogBaseColor.set(fogSettings.color))
updateFogControllers()
fogFolder.close()

// Lights
const lightsFolder = gui.addFolder('Освітлення')
lightsFolder.addColor(ambientLight, 'color').name('Ambient: колір')
lightsFolder.add(ambientLight, 'intensity', 0, 3, 0.001).name('Ambient: інтенсивність')
lightsFolder.addColor(directionalLight, 'color').name('Місяць: колір')
lightsFolder.add(directionalLight, 'intensity', 0, 5, 0.001).name('Місяць: інтенсивність')
lightsFolder.add(directionalLight.position, 'x', - 10, 10, 0.1).name('Місяць: x')
lightsFolder.add(directionalLight.position, 'y', 0.5, 10, 0.1).name('Місяць: y')
lightsFolder.add(directionalLight.position, 'z', - 10, 10, 0.1).name('Місяць: z')
lightsFolder.addColor(doorLight, 'color').name('Ліхтар: колір').onChange(() => lanternGlassMaterial.emissive.copy(doorLight.color))
lightsFolder.add(lightSettings, 'doorIntensity', 0, 15, 0.01).name('Ліхтар: інтенсивність')
lightsFolder.add(lightSettings, 'doorFlicker').name('Ліхтар: миготіння')
lightsFolder.add(lightSettings, 'doorFlickerStrength', 0, 1, 0.01).name('Сила миготіння')
lightsFolder.addColor(windowGlassMaterial, 'emissive').name('Вікна: колір')
lightsFolder.add(lightSettings, 'windowsGlow', 0, 3, 0.01).name('Вікна: яскравість')
lightsFolder.add(lightSettings, 'windowsFlicker').name('Вікна: свічки')
lightsFolder.add(lightSettings, 'lightning').name('Блискавки')
lightsFolder.add(lightSettings, 'lightningIntensity', 0, 10, 0.1).name('Сила блискавки')
lightsFolder.add(lightSettings, 'lightningInterval', 3, 40, 1).name('Інтервал блискавок, с')
lightsFolder.add({ flash: () => triggerLightning(timer.getElapsed()) }, 'flash').name('⚡ Блискавка зараз')
lightsFolder.close()

// Ghosts
const ghostsFolder = gui.addFolder('Привиди')
ghostsFolder.add(ghostSettings, 'speed', 0, 4, 0.01).name('Швидкість')
ghostsFolder.add(ghostSettings, 'radius', 0.5, 1.4, 0.01).name('Радіус орбіт')
ghostsFolder.add(ghostSettings, 'intensity', 0, 20, 0.1).name('Яскравість').onChange(() => ghosts.forEach((ghost) => ghost.light.intensity = ghostSettings.intensity))
ghostsFolder.add(ghostSettings, 'bodies').name('Показувати тіла').onChange(() => ghosts.forEach((ghost) => ghost.body.visible = ghostSettings.bodies))
ghostsFolder.add(ghostSettings, 'opacity', 0.05, 1, 0.01).name('Прозорість тіл').onChange(() => ghosts.forEach((ghost) => ghost.bodyMaterial.opacity = ghostSettings.opacity))
ghostsFolder.add(ghostSettings, 'shadows').name('Тіні від привидів').onChange(() => ghosts.forEach((ghost) => ghost.light.castShadow = ghostSettings.shadows))
ghosts.forEach((ghost, index) =>
{
    ghostsFolder.addColor(ghost, 'color').name(`Колір привида ${index + 1}`).onChange(() =>
    {
        ghost.light.color.set(ghost.color)
        ghost.bodyMaterial.emissive.set(ghost.color)
    })
})
ghostsFolder.close()

// Textures & materials
const texturesFolder = gui.addFolder('Текстури й матеріали')
const setRepeat = (textures, x, y = x) => textures.forEach((texture) => texture.repeat.set(x, y))
texturesFolder.add(textureSettings, 'floorRepeat', 1, 30, 1).name('Повтор: земля').onChange((value) => setRepeat(floorTextures, value))
texturesFolder.add(textureSettings, 'wallRepeat', 0.5, 4, 0.1).name('Повтор: цегла').onChange((value) => setRepeat(wallTextures, value))
texturesFolder.add(textureSettings, 'roofRepeat', 1, 8, 0.1).name('Повтор: дах').onChange((value) => setRepeat(roofTextures, value, 1))
texturesFolder.add(textureSettings, 'graveRepeat', 0.1, 2, 0.01).name('Повтор: камінь').onChange((value) => setRepeat(graveTextures, value, value * 4 / 3))
texturesFolder.add(floor.material, 'displacementScale', 0, 1, 0.001).name('Рельєф землі')
texturesFolder.add(floor.material, 'displacementBias', - 1, 1, 0.001).name('Зсув рельєфу')
texturesFolder.addColor(bushMaterial, 'color').name('Колір кущів')
texturesFolder.addColor(barkMaterial, 'color').name('Колір дерев')
texturesFolder.addColor(fireflyMaterial, 'color').name('Колір світлячків')
texturesFolder.close()

// Animation
const animationSettings = { shedDoor: true, fireflies: true }
const animationFolder = gui.addFolder('Анімація')
animationFolder.add(animationSettings, 'shedDoor').name('Рипучі двері сараю')
animationFolder.add(animationSettings, 'fireflies').name('Світлячки').onChange((value) => fireflies.visible = value)
animationFolder.close()

// Sound
const soundFolder = gui.addFolder('Звук')
soundFolder.add({ start: startSound }, 'start').name('▶ Увімкнути звук')
soundFolder.add(soundSettings, 'master', 0, 1, 0.01).name('Загальна гучність').onChange((value) => { if(soundStarted) listener.setMasterVolume(value) })
soundFolder.add(soundSettings, 'wind', 0, 1, 0.01).name('Вітер').onChange((value) => windAudio?.setVolume(value))
soundFolder.add(soundSettings, 'ghosts', 0, 1, 0.01).name('Стогін привидів').onChange((value) => ghosts.forEach((ghost) => ghost.audio?.setVolume(value)))
soundFolder.add(soundSettings, 'thunder').name('Грім')
soundFolder.close()

/**
 * Animate
 */
const timer = new Timer()
const fireflyPositions = fireflyGeometry.attributes.position

const tick = () =>
{
    // Timer
    timer.update()
    const elapsedTime = timer.getElapsed()

    // Ghosts
    ghosts.forEach((ghost, index) =>
    {
        const angle = elapsedTime * ghost.speed * ghostSettings.speed
        const radius = ghost.radius * ghostSettings.radius
        const bob = Math.sin(angle) * Math.sin(angle * 2.34) * Math.sin(angle * 3.45)
        ghost.group.position.set(
            Math.cos(angle) * radius,
            0.9 + bob * 0.8,
            Math.sin(angle) * radius
        )

        // Повертаємо привида обличчям у напрямку руху
        const direction = Math.sign(ghost.speed * ghostSettings.speed) || 1
        ghost.group.rotation.y = Math.atan2(- Math.sin(angle) * direction, Math.cos(angle) * direction)
        ghost.body.rotation.z = Math.sin(elapsedTime * 2 + index) * 0.12
        ghost.body.scale.y = 1 + Math.sin(elapsedTime * 3 + index * 2) * 0.05
    })

    // Door light flicker
    let doorFactor = 1
    if(lightSettings.doorFlicker)
    {
        const wave = Math.sin(elapsedTime * 23) * Math.sin(elapsedTime * 7.7) * Math.sin(elapsedTime * 2.9)
        const flicker = (wave > 0.45 ? 0.08 : 1) * (0.88 + Math.random() * 0.12)
        doorFactor = THREE.MathUtils.lerp(1, flicker, lightSettings.doorFlickerStrength)
    }
    doorLight.intensity = lightSettings.doorIntensity * doorFactor
    lanternGlassMaterial.emissiveIntensity = 0.3 + doorFactor * 1.7

    // Windows candle glow
    const candle = lightSettings.windowsFlicker
        ? 0.85 + Math.sin(elapsedTime * 6.3) * Math.sin(elapsedTime * 2.7) * 0.12 + Math.random() * 0.05
        : 1
    windowGlassMaterial.emissiveIntensity = lightSettings.windowsGlow * candle

    // Shed door creak
    if(animationSettings.shedDoor)
        shedDoorHinge.rotation.y = - 0.25 - Math.sin(elapsedTime * 0.7) * Math.sin(elapsedTime * 1.3) * 0.25

    // Fireflies
    if(animationSettings.fireflies)
    {
        for(let i = 0; i < fireflyCount; i++)
        {
            const phase = fireflyPhase[i]
            fireflyPositions.setXYZ(
                i,
                fireflyBase[i * 3 + 0] + Math.sin(elapsedTime * 0.5 + phase) * 0.4,
                fireflyBase[i * 3 + 1] + Math.sin(elapsedTime * 1.1 + phase * 2) * 0.25,
                fireflyBase[i * 3 + 2] + Math.cos(elapsedTime * 0.4 + phase) * 0.4
            )
        }
        fireflyPositions.needsUpdate = true
        fireflyMaterial.opacity = 0.75 + Math.sin(elapsedTime * 4) * 0.25
    }

    // Lightning
    if(lightSettings.lightning && elapsedTime > nextLightning)
        triggerLightning(elapsedTime)
    const flash = getLightningFlash(elapsedTime)
    lightningLight.intensity = flash * lightSettings.lightningIntensity
    if(scene.fog)
        scene.fog.color.copy(fogBaseColor).lerp(fogFlashColor, flash * 0.5)

    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()

