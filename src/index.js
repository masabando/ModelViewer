import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { VRMLoaderPlugin } from '@pixiv/three-vrm';


function main() {
  // URLのクエリ(「?xxx」の部分)を取得して ? を削除
  let query = location.search.replace("?", "");

  // キャンバスの設定
  const canvas = document.querySelector('#canvas');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  // レンダラの設定
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
  });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  THREE.ColorManagement.enabled = true;
  renderer.userLegacyLights = true;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = true;

  // シーンの設定
  const defaultCameraPosition = [0, 50, 100];
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xa0a0a0);
  scene.fog = new THREE.Fog(0xa0a0a0, 200, 1000);
  // カメラの設定
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(...defaultCameraPosition);
  const controls = new OrbitControls(camera, canvas);
  controls.target.set(0, 30, 0);
  controls.enableDamping = true;
  controls.dampingFactor = 0.2;
  controls.update();


  // ライトの設定
  // [直線光源]
  const dLight = new THREE.DirectionalLight(0xffffff, 3.0);
  dLight.position.set(-1, 2, 1);
  dLight.castShadow = true;
  dLight.shadow.mapSize.width = 2048;
  dLight.shadow.mapSize.height = 2048;
  scene.add(dLight);
  // [環境光]
  const aLight = new THREE.AmbientLight(0xffffff, 1.0);
  scene.add(aLight);


  // 床の作成と追加
  // [床]
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(2000, 2000),
    new THREE.MeshPhongMaterial({ color: 0x999999, depthWrite: false })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);
  // [グリッド]
  const grid = new THREE.GridHelper(2000, 50, 0x3333ff, 0x333333);
  scene.add(grid);


  // モデルの読み込み
  let modelData;
  let yPosInput = document.querySelector("#yPosInput");
  let loader;
  // モデルファイル名を取得
  let model = ModelList[query];
  if (model) {
    // モデルタイプを取得
    let modelType = model.split(".").reverse()[0];
    // モデルタイプによって読み込み方法を変更
    switch (modelType) {
      case "fbx":
        loader = new FBXLoader();
        break;
      case "vrm":
        loader = new GLTFLoader();
        loader.register((parser) => {
          return new VRMLoaderPlugin(parser);
        });
        aLight.intensity = 1.0;
        dLight.intensity = 0.5;
        break;
    }
    // モデル読み込み
    loader.load(
      `./model/${model}`,
      (_m) => {
        let m;
        // モデルタイプによってスケールを変更
        switch (modelType) {
          case "fbx":
            m = _m;
            console.log(m);
            m.scale.set(0.1, 0.1, 0.1);
            break;
          case "vrm":
            m = _m.userData.vrm.scene;
            m.scale.set(40, 40, 40);
            break;
        }
        // モデルの影の設定
        m.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        scene.add(m);
        modelData = m;
        yPosInput.value = "0";
        // モデルのY座標を調整
        yPosInput.addEventListener("input", (e) => {
          modelData.position.set(0, +yPosInput.value, 0);
        });
      },
      (xhr) => { },
      (error) => {
        console.error(error);
        alert("モデルファイルがないよ");
      }
    )
  }

  // アニメーションさせる
  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }
  animate();

  // カメラリセット
  document.querySelector("#resetButton").addEventListener("click", () => {
    controls.reset();
    controls.target.set(0, 30, 0);
    controls.update();
    yPosInput.value = "0";
    modelData.position.set(0, +yPosInput.value, 0);
  });
}

let ModelList;
fetch('./modelList.js').then(j => j.text()).then(t => eval(t)).then(() => main());
