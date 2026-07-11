import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <span className={styles.logo}>harmoni</span>
      <span className={styles.copy}>© {new Date().getFullYear()} Harmoni. All rights reserved.</span>
    </footer>
  );
}
