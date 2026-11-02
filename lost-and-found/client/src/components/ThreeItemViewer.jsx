import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function ThreeItemViewer({ item, onClose }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 350;
    const height = container.clientHeight || 300;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const group = new THREE.Group();
    scene.add(group);

    // Pick 3D geometry based on category
    let geometry;
    const cat = (item.category || "").toLowerCase();
    if (cat.includes("electronic")) {
      geometry = new THREE.OctahedronGeometry(1.4, 0);
    } else if (cat.includes("access") || cat.includes("bag")) {
      geometry = new THREE.TorusGeometry(1.1, 0.35, 16, 50);
    } else if (cat.includes("key")) {
      geometry = new THREE.TorusKnotGeometry(0.9, 0.25, 64, 8);
    } else if (cat.includes("book") || cat.includes("doc")) {
      geometry = new THREE.BoxGeometry(1.6, 2.0, 0.4);
    } else {
      geometry = new THREE.DodecahedronGeometry(1.3, 0);
    }

    const isLost = item.type === "Lost";
    const primaryColor = isLost ? 0xf59e0b : 0x10b981;
    const accentColor = isLost ? 0xef4444 : 0x06b6d4;

    // Solid core
    const material = new THREE.MeshStandardMaterial({
      color: primaryColor,
      roughness: 0.25,
      metalness: 0.85,
      emissive: primaryColor,
      emissiveIntensity: 0.35,
    });
    const mesh = new THREE.Mesh(geometry, material);
    group.add(mesh);

    // Wireframe cage
    const wireMat = new THREE.MeshBasicMaterial({
      color: accentColor,
      wireframe: true,
      transparent: true,
      opacity: 0.6,
    });
    const wireMesh = new THREE.Mesh(geometry, wireMat);
    wireMesh.scale.set(1.08, 1.08, 1.08);
    group.add(wireMesh);

    // Scanline ring
    const scanRingGeo = new THREE.RingGeometry(1.8, 1.85, 32);
    const scanRingMat = new THREE.MeshBasicMaterial({
      color: 0x00f5ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.7,
    });
    const scanRing = new THREE.Mesh(scanRingGeo, scanRingMat);
    scanRing.rotation.x = Math.PI / 2;
    group.add(scanRing);

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambient);
    const light1 = new THREE.PointLight(primaryColor, 3, 20);
    light1.position.set(3, 4, 3);
    scene.add(light1);
    const light2 = new THREE.PointLight(accentColor, 2, 20);
    light2.position.set(-3, -3, 3);
    scene.add(light2);

    // Mouse drag interaction
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;

    const onMouseDown = (e) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };
    const onMouseMove = (e) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;
      group.rotation.y += deltaX * 0.01;
      group.rotation.x += deltaY * 0.01;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };
    const onMouseUp = () => {
      isDragging = false;
    };

    container.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    let animId;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const time = clock.getElapsedTime();

      if (!isDragging) {
        group.rotation.y += 0.015;
        group.rotation.x = Math.sin(time * 0.8) * 0.15;
      }

      // Vertical scanner sweep
      scanRing.position.y = Math.sin(time * 2) * 1.5;

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      container.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      wireMat.dispose();
      scanRingGeo.dispose();
      scanRingMat.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [item]);

  return (
    <div className="modal-backdrop-3d" onClick={onClose}>
      <div className="modal-content-3d" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-3d">
          <div className="d-flex align-items-center gap-2">
            <span className="live-dot" />
            <span className="eyebrow-tech">3D HOLOGRAPHIC SCANNER</span>
          </div>
          <button className="btn-close-neon" onClick={onClose} aria-label="Close">
            <i className="bi bi-x-lg" />
          </button>
        </div>

        <div className="modal-body-3d">
          <div className="scanner-canvas-wrap">
            <div className="scanner-badge-top">
              <span className={`badge-pill-3d ${item.type.toLowerCase()}`}>
                {item.type} ITEM
              </span>
              <span className="badge-pill-status">{item.status}</span>
            </div>
            <div ref={mountRef} className="three-mount" />
            <div className="scanner-hint">
              <i className="bi bi-arrows-move me-1" /> Drag to inspect in 3D
            </div>
          </div>

          <div className="scanner-details">
            <div className="category-tag">{item.category}</div>
            <h3 className="item-title-3d">{item.itemName}</h3>
            <p className="item-desc-3d">{item.description}</p>

            <div className="grid-meta-3d">
              <div className="meta-box">
                <i className="bi bi-geo-alt-fill text-cyan" />
                <div>
                  <small>CAMPUS LOCATION</small>
                  <strong>{item.location}</strong>
                </div>
              </div>
              <div className="meta-box">
                <i className="bi bi-calendar-event text-emerald" />
                <div>
                  <small>RECORDED DATE</small>
                  <strong>{new Date(item.date).toLocaleDateString()}</strong>
                </div>
              </div>
              <div className="meta-box">
                <i className="bi bi-person-badge text-violet" />
                <div>
                  <small>REPORTER CONTACT</small>
                  <strong>{item.contact}</strong>
                </div>
              </div>
              <div className="meta-box">
                <i className="bi bi-shield-check text-success" />
                <div>
                  <small>VERIFICATION ID</small>
                  <strong className="font-monospace text-truncate">
                    {String(item._id).slice(-8).toUpperCase()}
                  </strong>
                </div>
              </div>
            </div>

            <div className="scanner-actions">
              <button
                className="btn btn-neon-contact"
                onClick={() => {
                  if (item.contact && item.contact.includes("@")) {
                    const subject = encodeURIComponent(`Regarding MITAOE Lost & Found: ${item.itemName || "Item"}`);
                    const body = encodeURIComponent(
                      `Hello,\n\nI am contacting you regarding your Lost & Found report on the campus portal:\n• Item: ${item.itemName || "N/A"}\n• Location: ${item.location || "Campus"}\n\nPlease let me know if this item is still available or when we can coordinate.\n\nThank you!`
                    );
                    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(item.contact.trim())}&su=${subject}&body=${body}`;
                    window.open(gmailUrl, "_blank", "noopener,noreferrer");
                  } else {
                    window.alert(`Reporter Contact: ${item.contact || "Not provided"}`);
                  }
                }}
              >
                <i className="bi bi-google me-2" />
                Email via Gmail
              </button>
              <button className="btn btn-outline-cyber" onClick={onClose}>
                Close Scanner
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

