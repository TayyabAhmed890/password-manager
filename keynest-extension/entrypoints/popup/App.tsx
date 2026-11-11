import './App.css';

function App() {
  return (
    <main className="popup">
      <header className="popup__header">
        <span className="popup__mark" aria-hidden="true">K</span>
        <div>
          <h1>Keynest</h1>
          <p>Password Manager</p>
        </div>
      </header>

      <section className="popup__content" aria-labelledby="welcome-title">
        <h2 id="welcome-title">Your browser vault</h2>
        <p>
          The extension is set up. Account connection, saving logins, and
          user-triggered autofill will be added in the MVP.
        </p>
      </section>

      <footer className="popup__footer">Keep your logins close and secure.</footer>
    </main>
  );
}

export default App;
