const ctx = document.getElementById("myChart");
const ctx2 = document.getElementById("myChartPie");
const xValues = ["Italy", "France", "Spain", "USA", "Argentina"];
const yValues = [55, 49, 44, 24, 15];
const today = new Date();
const monday = new Date(today);
const day = monday.getDay();
monday.setDate(monday.getDate() - (day === 0 ? 6 : day - 1));
const labels = [];
for (let i = 0; i < 7; i++) {
  const date = new Date(monday);
  date.setDate(monday.getDate() + i);

  const day = String(date.getDate());
  const month = String(date.getMonth() + 1);

  labels.push(`${day}/${month}`);
}
const barColors = ["#b91d47", "#00aba9", "#2b5797", "#e8c3b9", "#1e7145"];
const data = [
  {
    id: 1,
    doiTac: "Studio Hoa Mai",
    ky: "10/2026",
    soDon: 24,
    soTien: 48500000,
    trangThai: "CHO_TRA",
  },
  {
    id: 2,
    doiTac: "Sky Event",
    ky: "10/2026",
    soDon: 18,
    soTien: 36200000,
    trangThai: "CHO_TRA",
  },
  {
    id: 3,
    doiTac: "Happy Party",
    ky: "09/2026",
    soDon: 31,
    soTien: 62000000,
    trangThai: "DA_TRA",
  },
  {
    id: 4,
    doiTac: "Lotus Decor",
    ky: "10/2026",
    soDon: 12,
    soTien: 21800000,
    trangThai: "CHO_TRA",
  },
];
new Chart(ctx, {
  type: "bar",
  data: {
    labels: labels,
    datasets: [
      {
        label: "Doanh thu (VNĐ)",
        data: [12, 19, 3, 5, 2, 3],
        borderWidth: 1,
        backgroundColor: "#6366f1",
      },
    ],
  },
  options: {
    scales: {
      y: {
        beginAtZero: true,
      },
    },
    plugins: {
      title: {
        display: true,
        text: "Doanh thu theo thời gian (VNĐ)",
        align: "center",
        font: {
          size: 20,
          weight: "bold",
        },
        padding: 20,
      },
    },
  },
});
new Chart(ctx2, {
  type: "pie",
  data: {
    labels: xValues,
    datasets: [
      {
        backgroundColor: barColors,
        data: yValues,
      },
    ],
  },
  options: {
    plugins: {
      legend: { display: true },
      title: {
        display: true,
        text: "Cơ cấu",
        font: { size: 16 },
      },
    },
  },
});
new DataTable("#mytable", {
  data: data,
  columns: [
    { data: "doiTac" },
    { data: "ky" },
    { data: "soDon" },
    { data: "soTien" },
    { data: "trangThai" },
  ],
  searching: false,
  paging: false,
  info: false,
  columnDefs: [{ targets: "_all", className: "dt-center" }],
});
