import { useState, useEffect, useRef, useCallback } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  addDoc,
  serverTimestamp,
  onSnapshot,
  orderBy,
  limit,
} from "firebase/firestore";
import { auth, db } from "./firebaseConfig";

const COLORS = ["#087CFF", "#FF7A9E", "#3ECF9B", "#B18BFF", "#FFB25A"];

export default function App() {
  const [screen, setScreen] = useState("home");
  const [user, setUser] = useState(null);
  const [pendingAge, setPendingAge] = useState(null);
  const [activeMatchId, setActiveMatchId] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return unsub;
  }, []);

  function goTo(next, extra) {
    if (extra?.age !== undefined) setPendingAge(extra.age);
    if (extra?.matchId !== undefined) setActiveMatchId(extra.matchId);
    setScreen(next);
  }

  return (
    <div className="app-shell">
      {screen === "home" && <HomeScreen goTo={goTo} />}
      {screen === "signup" && <SignUpScreen goTo={goTo} />}
      {screen === "login" && <LoginScreen goTo={goTo} />}
      {screen === "profile" && (
        <ProfileSetupScreen goTo={goTo} uid={user?.uid} age={pendingAge} />
      )}
      {screen === "discover" && <DiscoverScreen goTo={goTo} />}
      {screen === "matches" && <MatchesScreen goTo={goTo} />}
      {screen === "chat" && <ChatScreen goTo={goTo} matchId={activeMatchId} />}
    </div>
  );
}

function HomeScreen({ goTo }) {
  return (
    <div className="container center-col">
      <div className="eye">
        <div className="pupil">
          <span className="fs">FS</span>
        </div>
      </div>
      <h1 className="title">First Sight</h1>
      <p className="subtitle">Where first sight becomes something real.</p>
      <button className="button" onClick={() => goTo("signup")}>Create Account</button>
      <button className="link-button" onClick={() => goTo("login")}>I already have an account</button>
    </div>
  );
}

function SignUpScreen({ goTo }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [age, setAge] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSignUp(e) {
    e.preventDefault();
    setError("");
    const ageNum = parseInt(age, 10);
    if (!email.trim() || !password) return setError("Enter an email and password.");
    if (password.length < 6) return setError("Password needs 6+ characters.");
    if (!ageNum || ageNum < 18) return setError("You must be 18 or older.");

    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email.trim(), password);
      goTo("profile", { age: ageNum });
    } catch (err) {
      setError(err.message?.replace("Firebase: ", "") || "Something went wrong.");
    }
    setLoading(false);
  }

  return (
    <div className="container form-container">
      <h2 className="form-title">Create your account</h2>
      <p className="form-subtitle">First Sight is for adults 18 and up.</p>
      <form onSubmit={handleSignUp}>
        <input className="input" placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="input" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <input className="input" placeholder="Your age" type="number" value={age} onChange={(e) => setAge(e.target.value)} />
        {error && <p className="error">{error}</p>}
        <button className="button" type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create Account"}
        </button>
      </form>
      <button className="link-button" onClick={() => goTo("home")}>Back</button>
    </div>
  );
}

function LoginScreen({ goTo }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password) return setError("Enter your email and password.");
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      goTo("discover");
    } catch (err) {
      setError("Couldn't log in. Check your email and password.");
    }
    setLoading(false);
  }

  return (
    <div className="container form-container">
      <h2 className="form-title">Welcome back</h2>
      <form onSubmit={handleLogin}>
        <input className="input" placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="input" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <p className="error">{error}</p>}
        <button className="button" type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Log In"}
        </button>
      </form>
      <button className="link-button" onClick={() => goTo("home")}>Back</button>
    </div>
  );
}

function ProfileSetupScreen({ goTo, uid, age }) {
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave(e) {
    e.preventDefault();
    setError("");
    if (!name.trim()) return setError("Tell people your name.");
    const myUid = uid || auth.currentUser?.uid;
    if (!myUid) return setError("Something went wrong — try signing up again.");
    setSaving(true);
    try {
      await setDoc(doc(db, "users", myUid), {
        name: name.trim().slice(0, 24),
        bio: bio.trim().slice(0, 120),
        age: age || null,
        color,
        createdAt: serverTimestamp(),
      });
      goTo("discover");
    } catch (err) {
      setError("Couldn't save your profile. Try again.");
    }
    setSaving(false);
  }

  return (
    <div className="container form-container">
      <h2 className="form-title">Build your profile</h2>
      <p className="form-subtitle">This is what people see before they say hello.</p>
      <form onSubmit={handleSave}>
        <input className="input" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} maxLength={24} />
        <textarea className="input textarea" placeholder="A little about you..." value={bio} onChange={(e) => setBio(e.target.value)} maxLength={120} />
        <p className="label">Pick a color</p>
        <div className="color-row">
          {COLORS.map((c) => (
            <button
              type="button"
              key={c}
              onClick={() => setColor(c)}
              className={`swatch ${color === c ? "swatch-active" : ""}`}
              style={{ background: c }}
            />
          ))}
        </div>
        {error && <p className="error">{error}</p>}
        <button className="button" type="submit" disabled={saving}>
          {saving ? "Saving..." : "Start Discovering"}
        </button>
      </form>
    </div>
  );
}

function DiscoverScreen({ goTo }) {
  const [people, setPeople] = useState([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return goTo("login");
    setLoading(true);
    const swipeQ = query(collection(db, "swipes"), where("from", "==", uid));
    const swipeSnap = await getDocs(swipeQ);
    const swipedIds = swipeSnap.docs.map((d) => d.data().to);

    const usersSnap = await getDocs(collection(db, "users"));
    const list = [];
    usersSnap.forEach((d) => {
      if (d.id !== uid && !swipedIds.includes(d.id)) list.push({ id: d.id, ...d.data() });
    });
    setPeople(list);
    setIndex(0);
    setLoading(false);
    // eslint-disable-next-line
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleSwipe(liked) {
    const uid = auth.currentUser?.uid;
    const person = people[index];
    if (!uid || !person || busy) return;
    setBusy(true);

    const swipeId = `${uid}_${person.id}`;
    await setDoc(doc(db, "swipes", swipeId), {
      from: uid, to: person.id, liked, createdAt: serverTimestamp(),
    });

    let matchId = null;
    if (liked) {
      const theirSwipe = await getDoc(doc(db, "swipes", `${person.id}_${uid}`));
      if (theirSwipe.exists() && theirSwipe.data().liked) {
        matchId = [uid, person.id].sort().join("_");
        await setDoc(doc(db, "matches", matchId), {
          users: [uid, person.id], createdAt: serverTimestamp(),
        });
      }
    }

    setBusy(false);
    setIndex((i) => i + 1);
    if (matchId) {
      const goChat = window.confirm(`It's a match! 🎉 You and ${person.name} both said hi. Say hello now?`);
      if (goChat) goTo("chat", { matchId });
    }
  }

  if (loading) return <div className="center-screen">Loading...</div>;

  const person = people[index];

  return (
    <div className="container">
      <div className="header">
        <h2 className="header-title">Discover</h2>
        <button className="header-link" onClick={() => goTo("matches")}>Matches</button>
      </div>
      {!person ? (
        <div className="center-screen">
          <p className="empty-title">That's everyone for now</p>
          <p className="empty-sub">Check back later for new people.</p>
        </div>
      ) : (
        <>
          <div className="card">
            <div className="avatar" style={{ background: person.color || "#087CFF" }}>
              {(person.name || "?").charAt(0).toUpperCase()}
            </div>
            <p className="name">{person.name}{person.age ? `, ${person.age}` : ""}</p>
            <p className="bio">{person.bio || "No bio yet."}</p>
          </div>
          <div className="action-row">
            <button className="action-btn pass-btn" onClick={() => handleSwipe(false)} disabled={busy}>Pass</button>
            <button className="action-btn like-btn" onClick={() => handleSwipe(true)} disabled={busy}>Like</button>
          </div>
        </>
      )}
    </div>
  );
}

function MatchesScreen({ goTo }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) return;
      setLoading(true);
      const q = query(collection(db, "matches"), where("users", "array-contains", uid));
      const snap = await getDocs(q);
      const list = [];
      for (const d of snap.docs) {
        const data = d.data();
        const otherId = data.users.find((u) => u !== uid);
        const otherSnap = await getDoc(doc(db, "users", otherId));
        list.push({ id: d.id, other: otherSnap.exists() ? otherSnap.data() : {} });
      }
      setMatches(list);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="container">
      <div className="header">
        <button className="header-link" onClick={() => goTo("discover")}>Back</button>
        <h2 className="header-title">Your Matches</h2>
        <span style={{ width: 40 }} />
      </div>
      {loading ? (
        <p className="center-screen">Loading...</p>
      ) : matches.length === 0 ? (
        <div className="center-screen">
          <p className="empty-title">No matches yet</p>
          <p className="empty-sub">Keep discovering — your people are out there.</p>
        </div>
      ) : (
        <div className="matches-list">
          {matches.map((item) => (
            <button key={item.id} className="row" onClick={() => goTo("chat", { matchId: item.id })}>
              <span className="avatar avatar-sm" style={{ background: item.other?.color || "#087CFF" }}>
                {(item.other?.name || "?").charAt(0).toUpperCase()}
              </span>
              <span className="row-name">{item.other?.name || "Someone"}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ChatScreen({ goTo, matchId }) {
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const feedRef = useRef(null);
  const myUid = auth.currentUser?.uid;

  useEffect(() => {
    if (!matchId) return;
    const q = query(collection(db, "matches", matchId, "messages"), orderBy("createdAt", "asc"), limit(200));
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [matchId]);

  useEffect(() => {
    if (feedRef.current) feedRef.current.scrollTop = feedRef.current.scrollHeight;
  }, [messages]);

  async function handleSend(e) {
    e.preventDefault();
    const text = draft.trim();
    if (!text || !myUid || !matchId) return;
    setDraft("");
    await addDoc(collection(db, "matches", matchId, "messages"), {
      senderId: myUid, text, createdAt: serverTimestamp(),
    });
  }

  return (
    <div className="chat-shell">
      <div className="chat-header">
        <button className="header-link" onClick={() => goTo("matches")}>Back</button>
        <h2 className="header-title">Chat</h2>
        <span style={{ width: 40 }} />
      </div>
      <div ref={feedRef} className="feed">
        {messages.map((m) => {
          const mine = m.senderId === myUid;
          return (
            <div key={m.id} className={`bubble-row ${mine ? "bubble-row-mine" : ""}`}>
              <div className={`bubble ${mine ? "bubble-mine" : "bubble-theirs"}`}>{m.text}</div>
            </div>
          );
        })}
      </div>
      <form className="composer" onSubmit={handleSend}>
        <input className="composer-input" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Say something..." />
        <button className="send-btn" type="submit">Send</button>
      </form>
    </div>
  );
}
