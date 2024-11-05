export default function SessionHistoryData() {
  const session = sessionStorage.getItem("sessionWork");
console.log(!!session ? JSON.parse(session) : [])
  return !!session ? JSON.parse(session) : [];
}