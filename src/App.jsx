import React, { useState, useEffect } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { ClipLoader } from "react-spinners";
import gsap from "gsap";
import "./App.css"; // Import the CSS file

const texturePrices = {
  "/textures/texture1.jpg": 2, // 2 USD per meter square
  "/textures/texture2.jpg": 3, // 3 USD per meter square
  "/textures/texture3.jpg": 4, // 4 USD per meter square
};

const App = () => {
  const [squareWidth, setSquareWidth] = useState(4);
  const [squareHeight, setSquareHeight] = useState(3);
  const [texture, setTexture] = useState("/textures/texture1.jpg");
  const [textures, setTextures] = useState([]);
  const [square, setSquare] = useState(null);
  const [pricePerSquareMeter, setPricePerSquareMeter] = useState(texturePrices[texture]);
  const [totalPrice, setTotalPrice] = useState(squareWidth * squareHeight * texturePrices[texture]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch textures from the public/textures directory
    const fetchTextures = async () => {
      const texturePaths = [
        "/textures/texture1.jpg",
        "/textures/texture2.jpg",
        "/textures/texture3.jpg",
      ]; // Add more texture paths as needed
      setTextures(texturePaths);
    };

    fetchTextures();

    // Set up the scene, camera, renderer, and controls
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x151515); // Set background color
    const camera = new THREE.PerspectiveCamera(
      75,
      (window.innerWidth * 0.85) / window.innerHeight,
      0.1,
      100
    );
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth * 0.85, window.innerHeight);
    document.getElementById("scene-container").appendChild(renderer.domElement);

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // Soft white light
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 7.5);
    scene.add(directionalLight);

    // Add OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; // Smooth controls
    controls.dampingFactor = 0.25;
    controls.screenSpacePanning = false;
    controls.minDistance = 2;
    controls.maxDistance = 20;

    // Load texture
    const loader = new THREE.TextureLoader();
    const lightMaterial = new THREE.MeshBasicMaterial({ color: 0xd3d3d3 }); // Light color material for other sides
    let frontMaterial = new THREE.MeshBasicMaterial({ color: 0x151515 }); // Placeholder material for the front

    const applyTexture = (texturePath) => {
      loader.load(texturePath, (texture) => {
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(squareWidth, squareHeight);
        frontMaterial.map = texture;
        frontMaterial.color.set(0xffffff); // Set color to white to prevent overlay
        frontMaterial.needsUpdate = true;
      });
    };

    if (texture) {
      applyTexture(texture);
    }

    // Create a square with different materials for the front and other sides
    let square = null;
    const createSquare = (width, height) => {
      if (square) {
        scene.remove(square);
      }
      const squareGeometry = new THREE.BoxGeometry(width, height, 1);
      const materials = [
        lightMaterial, // Right
        lightMaterial, // Left
        lightMaterial, // Top
        lightMaterial, // Bottom
        frontMaterial, // Front
        lightMaterial, // Back
      ];
      square = new THREE.Mesh(squareGeometry, materials);
      square.position.y = height / 2; // Fix the bottom of the box at y = 0
      scene.add(square);
      setSquare(square);
    };

    createSquare(squareWidth, squareHeight);

    // Load and add the GLTF model
    const gltfLoader = new GLTFLoader();
    gltfLoader.load(
      "/model/scene.gltf",
      (gltf) => {
        const model = gltf.scene;
        model.position.set(0, 0, 2); // Adjust the position in front of the box
        model.scale.set(4, 4, 4); // Scale the model appropriately
        model.position.y -= 1.8; 
        scene.add(model);
        setLoading(false); // Model has loaded
      },
      undefined,
      (error) => {
        console.error("An error happened while loading the model", error);
      }
    );

    // Position the camera
    camera.position.z = 10;
    camera.position.y = squareHeight / 2;

    // Handle window resize
    const onWindowResize = () => {
      camera.aspect = (window.innerWidth * 0.85) / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth * 0.85, window.innerHeight);
    };

    window.addEventListener("resize", onWindowResize, false);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Clean up on component unmount
    return () => {
      window.removeEventListener("resize", onWindowResize);
      document.getElementById("scene-container").removeChild(renderer.domElement);
    };
  }, [squareWidth, squareHeight, texture]);

  useEffect(() => {
    if (square) {
      gsap.to(square.scale, { x: squareWidth, y: squareHeight, duration: 0.5 });
      const area = squareWidth * squareHeight;
      setTotalPrice(area * pricePerSquareMeter);
      gsap.to(square.position, { y: squareHeight / 2, duration: 0.5 }); // Adjust position to keep the bottom fixed
    }
  }, [squareWidth, squareHeight, square, pricePerSquareMeter]);

  useEffect(() => {
    if (square) {
      const loader = new THREE.TextureLoader();
      loader.load(texture, (tex) => {
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(squareWidth, squareHeight);
        const newFrontMaterial = new THREE.MeshBasicMaterial({
          map: tex,
          color: 0xffffff,
        }); // Set color to white
        const materials = [
          square.material[0], // Right
          square.material[1], // Left
          square.material[2], // Top
          square.material[3], // Bottom
          newFrontMaterial, // Front
          square.material[5], // Back
        ];
        gsap.to(square.material, {
          duration: 0.5,
          opacity: 0,
          onComplete: () => {
            square.material = materials;
            gsap.to(square.material, { duration: 0.5, opacity: 1 });
          },
        });
      });
    }
    setPricePerSquareMeter(texturePrices[texture]);
  }, [texture, squareWidth, squareHeight]);

  const handleWidthChange = (e) => {
    const newWidth = parseFloat(e.target.value);
    if (!isNaN(newWidth)) {
      setSquareWidth(newWidth);
    }
  };

  const handleHeightChange = (e) => {
    const newHeight = parseFloat(e.target.value);
    if (!isNaN(newHeight)) {
      setSquareHeight(newHeight);
    }
  };

  const handleTextureChange = (texturePath) => {
    setTexture(texturePath);
  };

  return (
    <div id="app-container">
      {loading && (
        <div className="loading-spinner">
          <ClipLoader color={"#ffffff"} loading={loading} size={150} />
        </div>
      )}
      <div id="scene-container"></div>
      <div className="control-panel">
        <u><h1>Nazkmart</h1></u>
        <div className="fieldset">
          <label>Wall Width (m):</label>
          <input
            type="number"
            value={squareWidth}
            onChange={handleWidthChange}
            step="0.1"
            min="0.1"
            max="10"
          />
        </div>
        <div className="fieldset">
          <label>Wall Height (m):</label>
          <input
            type="number"
            value={squareHeight}
            onChange={handleHeightChange}
            step="0.1"
            min="0.1"
            max="10"
          />
        </div>
        <div className="fieldset">
          <label>Select Texture:</label>
          <div>
            {textures.map((texturePath, index) => (
              <div
                key={index}
                style={{
                  display: "inline-block",
                  margin: "5px 0",
                  borderRadius: "10px",
                  width: "95%",
                  height: "50px",
                  backgroundImage: `url(${texturePath})`,
                  backgroundSize: "cover",
                  border:
                    texture === texturePath
                      ? "2px solid blue"
                      : "2px solid transparent",
                  cursor: "pointer",
                }}
                onClick={() => handleTextureChange(texturePath)}
              />
            ))}
          </div>
        </div>
        <div className="fieldset">
          <label>Unit Price: <span className="price">${pricePerSquareMeter.toFixed(2)}</span></label>
        </div>
        <div className="fieldset">
          <label>Total Price: <span className="price">${totalPrice.toFixed(2)}</span></label>
        </div>
        <a className="proceed-btn" href="#">Proceed</a>
      </div>
    </div>
  );
};

export default App;
