// Save as HeatExchangerForm.jsx
import React, { useState } from "react";
import { Table, Button, Row, Col, Card } from "react-bootstrap";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function HeatExchangerForm() {
  const cp = 4187;
  const [readings, setReadings] = useState([
    { mh: 0.19, mc: 0.22, Th_in: 75, Th_out: 67, Tc_in: 20, Tc_out: 29 },
    { mh: 0.25, mc: 0.20, Th_in: 85, Th_out: 70, Tc_in: 30, Tc_out: 50 },
    { mh: 0.30, mc: 0.22, Th_in: 90, Th_out: 75, Tc_in: 35, Tc_out: 55 },
  ]);
  const [A, setA] = useState(0.278);
  const [results, setResults] = useState([]);
  const [avgEfficiency, setAvgEfficiency] = useState(null);

  const styles = {
    container: { backgroundColor: '#f4f6f9', padding: '2rem', minHeight: '100vh' },
    heading: { color: '#2c3e50', fontWeight: 700, textAlign: 'center', fontSize: '2rem', marginBottom: '2rem' },
    subheading: { fontSize: '1.3rem', fontWeight: 600, color: '#34495e', marginBottom: '1rem' },
    card: { borderRadius: '12px', padding: '1.5rem', backgroundColor: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', marginBottom: '2rem' },
    chart: { height: '350px', marginBottom: '2rem' },
    input: { textAlign: 'center' },
    label: { fontWeight: 500, marginBottom: '0.5rem', display: 'block' },
    button: { width: '100%', padding: '10px 0', fontWeight: '600', fontSize: '1rem', borderRadius: '8px' }
  };

  const handleChange = (e, index, field) => {
    const newReadings = [...readings];
    newReadings[index][field] = parseFloat(e.target.value);
    setReadings(newReadings);
  };

  const handleAreaChange = (e) => setA(parseFloat(e.target.value));

  const calculate = () => {
    const newResults = readings.map((r) => {
      const Qh = r.mh * cp * (r.Th_in - r.Th_out);
      const Qc = r.mc * cp * (r.Tc_out - r.Tc_in);
      const Q = (Qh + Qc) / 2;

      const deltaT1 = r.Th_in - r.Tc_out;
      const deltaT2 = r.Th_out - r.Tc_in;
      const LMTD = Math.abs(deltaT1 - deltaT2) < 1e-6
        ? deltaT1
        : ((deltaT1 - deltaT2) / Math.log(deltaT1 / deltaT2));

      const U = Q / (A * LMTD);
      const Cmin = Math.min(r.mh * cp, r.mc * cp);
      const Qmax = Cmin * (r.Th_in - r.Tc_in);
      const effectiveness = Q / Qmax;

      return { ...r, Q, Qh, Qc, LMTD, U, effectiveness };
    });

    setResults(newResults);
    const avgEff = newResults.reduce((sum, r) => sum + r.effectiveness, 0) / newResults.length;
    setAvgEfficiency((avgEff * 100).toFixed(2));
  };

  const xLabels = results.map(r => r.mh);

  const chartOptions = (label) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' }, title: { display: false } },
    scales: {
      x: { title: { display: true, text: 'ṁₕ (kg/s)' } },
      y: { title: { display: true, text: label } }
    }
  });

  const chartData = (label, key, color) => ({
    labels: xLabels,
    datasets: [{ label, data: results.map(r => r[key]), borderColor: color, backgroundColor: color, fill: false }],
  });

  const parameterLabels = [
    { label: 'ṁₕ (kg/s)', key: 'mh' },
    { label: 'ṁ𝒸 (kg/s)', key: 'mc' },
    { label: 'Th_in (°C)', key: 'Th_in' },
    { label: 'Th_out (°C)', key: 'Th_out' },
    { label: 'Tc_in (°C)', key: 'Tc_in' },
    { label: 'Tc_out (°C)', key: 'Tc_out' },
  ];

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Double Pipe Heat Exchanger Analysis</h1>
      <div style={styles.card}>
        <h2 style={styles.subheading}>Multi-Reading Heat Exchanger Tool</h2>
        <Table bordered responsive>
          <thead>
            <tr>
              <th>Parameter</th>
              {readings.map((_, idx) => (<th key={idx}>Reading {idx + 1}</th>))}
            </tr>
          </thead>
          <tbody>
            {parameterLabels.map(({ label, key }) => (
              <tr key={key}>
                <td>{label}</td>
                {readings.map((r, idx) => (
                  <td key={idx}>
                    <input type="number" value={r[key]} onChange={(e) => handleChange(e, idx, key)} className="form-control" style={styles.input} step="any" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </Table>
        <Row className="mb-3">
          <Col md={4}>
            <label style={styles.label}>Surface Area (m²):</label>
            <input type="number" value={A} onChange={handleAreaChange} className="form-control" style={styles.input} step="any" />
          </Col>
          <Col md={4} className="d-flex align-items-end">
            <Button variant="primary" onClick={calculate} style={styles.button}>Calculate</Button>
          </Col>
        </Row>
      </div>

      {results.length > 0 && (
        <>
          <div style={styles.card}>
            <h3 style={styles.subheading}>Results Table</h3>
            <Table bordered responsive>
              <thead>
                <tr>
                  <th>ṁₕ (kg/s)</th>
                  <th>ṁ𝒸 (kg/s)</th>
                  <th>Q (W)</th>
                  <th>LMTD (°C)</th>
                  <th>U (W/m²°C)</th>
                  <th>Effectiveness</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, idx) => (
                  <tr key={idx}>
                    <td>{r.mh}</td>
                    <td>{r.mc}</td>
                    <td>{r.Q.toFixed(2)}</td>
                    <td>{r.LMTD.toFixed(2)}</td>
                    <td>{r.U.toFixed(2)}</td>
                    <td>{(r.effectiveness * 100).toFixed(2)}%</td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <p style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#2e7d32' }}>
               Average Heat Exchanger Efficiency: <strong>{avgEfficiency}%</strong>
            </p>
          </div>

          <div style={styles.card}>
            <h3 style={styles.subheading}>Graphical Analysis</h3>
            <Row>
              <Col md={6}><div style={styles.chart}><Line data={chartData("Heat Transfer (Q)", "Q", "#2e86de")} options={chartOptions("Q (W)")} /></div></Col>
              <Col md={6}><div style={styles.chart}><Line data={chartData("Overall Heat Transfer Coefficient (U)", "U", "#28b463")} options={chartOptions("U (W/m²°C)")} /></div></Col>
            </Row>
            <Row>
              <Col md={6}><div style={styles.chart}><Line data={chartData("LMTD", "LMTD", "#e67e22")} options={chartOptions("LMTD (°C)")} /></div></Col>
              <Col md={6}><div style={styles.chart}><Line data={chartData("Effectiveness", "effectiveness", "#8e44ad")} options={chartOptions("Effectiveness")} /></div></Col>
            </Row>
          </div>

          <div style={styles.card}>
            <h3 style={styles.subheading}>Conclusion</h3>
            <p>
              Based on the readings and analysis, the average effectiveness of the heat exchanger is <strong>{avgEfficiency}%</strong>,
              and the overall heat transfer coefficient (U) varies based on the flow rates and inlet/outlet temperature conditions.
              These insights are useful for optimizing the performance of the double pipe heat exchanger.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
