export default function AuthButton({ onSignIn }) {
  return (
    <button style={styles.btn} onClick={onSignIn}>
      Sign in with Google
    </button>
  )
}

const styles = {
  btn: {
    padding: '0.5rem 1rem',
    background: '#fff',
    color: '#333',
    border: 'none',
    borderRadius: 8,
    fontSize: '0.85rem',
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
    whiteSpace: 'nowrap',
  },
}
