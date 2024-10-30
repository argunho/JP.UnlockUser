export default function SessionHistoryData() {
  const session = sessionStorage.getItem("sessionWork");

  return session !== null ? JSON.parse(session) : [];
}