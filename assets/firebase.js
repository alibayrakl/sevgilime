// assets/firebase.js (ES Module)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import {
  getFirestore, doc, getDoc, setDoc, onSnapshot,
  collection, addDoc, getDocs, query, orderBy, updateDoc, deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAYT_X6oOOOdvXJ7cxCSC-VW5BWjs1vMLs",
  authDomain: "site-1ba8a.firebaseapp.com",
  projectId: "site-1ba8a",
  storageBucket: "site-1ba8a.firebasestorage.app",
  messagingSenderId: "833632143463",
  appId: "1:833632143463:web:b4f2180edccba970866cc2"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Auth
export const watchAuth = (cb) => onAuthStateChanged(auth, cb);
export const login = (email, pass) => signInWithEmailAndPassword(auth, email, pass);
export const logout = () => signOut(auth);

// Site settings doc: site/settings
export const settingsRef = doc(db, "site", "settings");
export async function getSettingsOnce(){
  const snap = await getDoc(settingsRef);
  return snap.exists() ? snap.data() : null;
}
export async function saveSettings(data){
  return setDoc(settingsRef, data, { merge: true });
}
export function watchSettings(cb){
  return onSnapshot(settingsRef, (snap) => cb(snap.exists() ? snap.data() : null));
}

// Timeline
export const timelineCol = collection(db, "timeline");
export async function listTimeline(){
  const q = query(timelineCol, orderBy("order","asc"), orderBy("createdAt","asc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id:d.id, ...d.data() }));
}
export const addTimeline = (item) => addDoc(timelineCol, item);
export const updateTimeline = (id, patch) => updateDoc(doc(db,"timeline",id), patch);
export const deleteTimeline = (id) => deleteDoc(doc(db,"timeline",id));

// Memories
export const memoriesCol = collection(db, "memories");
export async function listMemories(){
  const q = query(memoriesCol, orderBy("createdAt","desc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id:d.id, ...d.data() }));
}
export const addMemory = (item) => addDoc(memoriesCol, item);
export const updateMemory = (id, patch) => updateDoc(doc(db,"memories",id), patch);
export const deleteMemory = (id) => deleteDoc(doc(db,"memories",id));

// Photos (URL based)
export const photosCol = collection(db, "photos");
export async function listPhotos(){
  const q = query(photosCol, orderBy("order","asc"), orderBy("createdAt","desc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id:d.id, ...d.data() }));
}
export const updatePhoto = (id, patch) => updateDoc(doc(db,"photos",id), patch);
export const deletePhoto = (id) => deleteDoc(doc(db,"photos",id));

/** ✅ ADMIN.JS bunu bekliyor */
export async function addPhotoByUrl({ url, title }){
  const current = await listPhotos();
  const maxOrder = current.reduce((m,p)=>Math.max(m, Number(p.order||0)), 0);
  return addDoc(photosCol, {
    title: (title || "").trim(),
    url: (url || "").trim(),
    order: maxOrder + 1,
    createdAt: Date.now()
  });
}