import styles from './style.less';

const Dashboard = () => {
  return (
    <iframe
      className={styles.dashboard}
      src="/dashboard-page/projects/1/tables"
      allowFullScreen
    />
  );
};

export default Dashboard;
