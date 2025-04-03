/* Updated with dynamic efficiency, experimental PPT readings, graphs, and results table */

import React, { useState } from "react";
import { Table, Button, Row, Col, Card } from "react-bootstrap";
import { Line, Bar } from "react-chartjs-2";
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
  const cp = 4186;
  const [readings, setReadings] = useState([
    { m: 0.22, Th_in: 78, Th_out: 65, Tc_in: 29, Tc_out: 46 },
    { m: 0.25, Th_in: 85, Th_out: 70, Tc_in: 30, Tc_out: 50 },
    { m: 0.30, Th_in: 90, Th_out: 75, Tc_in: 35, Tc_out: 55 },
  ]);
  const [A, setA] = useState(0.157);
  const [results, setResults] = useState([]);
  const [avgEfficiency, setAvgEfficiency] = useState(null);

  const styles = {
    container: { backgroundColor: '#f4f6f9', padding: '2rem', minHeight: '100vh' },
    heading: { color: '#2c3e50', fontWeight: 700, textAlign: 'center', fontSize: '2rem', marginBottom: '2rem' },
    subheading: { fontSize: '1.3rem', fontWeight: 600, color: '#34495e', marginBottom: '1rem' },
    card: { borderRadius: '12px', padding: '1.5rem', backgroundColor: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', marginBottom: '2rem' },
    chart: { height: '350px' },
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
      const Qh = r.m * cp * (r.Th_in - r.Th_out);
      const Qc = r.m * cp * (r.Tc_out - r.Tc_in);
      const Q = Math.min(Qh, Qc);
      const deltaT1 = r.Th_in - r.Tc_out;
      const deltaT2 = r.Th_out - r.Tc_in;
      const LMTD = (deltaT1 - deltaT2) / Math.log(deltaT1 / deltaT2);
      const U = Q / (A * LMTD);
      const Cmin = r.m * cp;
      const Qmax = Cmin * (r.Th_in - r.Tc_in);
      const effectiveness = Q / Qmax;
      return {
        ...r,
        Q: Q / 1000,
        Qh: Qh / 1000,
        Qc: Qc / 1000,
        LMTD,
        U,
        effectiveness,
      };
    });
    setResults(newResults);
    const avgEff = newResults.reduce((sum, r) => sum + r.effectiveness, 0) / newResults.length;
    setAvgEfficiency((avgEff * 100).toFixed(2));
  };

  const xLabels = results.map(r => r.m);

  const chartOptions = (yAxisLabel = 'Value') => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { font: { size: 14 } } },
      tooltip: { bodyFont: { size: 14 }, titleFont: { size: 16 } },
      title: { display: false }
    },
    scales: {
      x: { title: { display: true, text: 'ṁ (kg/s)', font: { size: 16 } }, ticks: { font: { size: 14 } }, beginAtZero: true },
      y: { title: { display: true, text: yAxisLabel, font: { size: 16 } }, ticks: { font: { size: 14 } }, beginAtZero: true }
    }
  });

  const chartData = (label, key, color) => ({
    labels: xLabels,
    datasets: [{ label, data: results.map(r => r[key]), borderColor: color, backgroundColor: color, fill: false }],
  });

  const barData = {
    labels: xLabels,
    datasets: [
      { label: 'Qh (kW)', data: results.map(r => r.Qh), backgroundColor: '#36A2EB' },
      { label: 'Qc (kW)', data: results.map(r => r.Qc), backgroundColor: '#FF6384' }
    ],
  };

  const parameterLabels = [
    { label: 'ṁ (kg/s)', key: 'm' },
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
                  <th>ṁ (kg/s)</th>
                  <th>Q (W)</th>
                  <th>U (W/m²°C)</th>
                  <th>LMTD (°C)</th>
                  <th>Effectiveness</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, idx) => (
                  <tr key={idx}>
                    <td>{r.m}</td>
                    <td>{r.Q.toFixed(2)}</td>
                    <td>{r.U.toFixed(2)}</td>
                    <td>{r.LMTD.toFixed(2)}</td>
                    <td>{r.effectiveness.toFixed(3)}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
            {avgEfficiency && (
              <p style={{ fontSize: '1.1rem', fontWeight: '500', color: '#2e7d32', marginBottom: '20px', backgroundColor: '#e8f5e9', padding: '10px', borderRadius: '8px' }}>
                ✅ Average Heat Exchanger Efficiency based on readings: <strong>{avgEfficiency}%</strong>
              </p>
            )}
          </div>

          <div style={styles.card}>
            <h3 style={styles.subheading}>Performance Graphs Based on All Readings</h3>
            <Row>
              <Col md={6}><Card style={styles.card}><Card.Body><Card.Title>Q vs ṁ</Card.Title><div style={styles.chart}><Line data={chartData("Q (kW)", "Q", "green")} options={chartOptions("Q (kW)")} /></div><p><strong>Conclusion:</strong> Higher mass flow rate leads to greater Q due to more thermal energy transfer.</p></Card.Body></Card></Col>
              <Col md={6}><Card style={styles.card}><Card.Body><Card.Title>LMTD vs ṁ</Card.Title><div style={styles.chart}><Line data={chartData("LMTD (°C)", "LMTD", "blue")} options={chartOptions("LMTD (°C)")} /></div><p><strong>Conclusion:</strong> LMTD variation shows temperature differential effectiveness under varying flow.</p></Card.Body></Card></Col>
            </Row>
            <Row>
              <Col md={6}><Card style={styles.card}><Card.Body><Card.Title>U vs ṁ</Card.Title><div style={styles.chart}><Line data={chartData("U (W/m²°C)", "U", "red")} options={chartOptions("U (W/m²°C)")} /></div><p><strong>Conclusion:</strong> U increases with flow indicating enhanced convective heat transfer.</p></Card.Body></Card></Col>
              <Col md={6}><Card style={styles.card}><Card.Body><Card.Title>Effectiveness vs ṁ</Card.Title><div style={styles.chart}><Line data={chartData("Effectiveness", "effectiveness", "orange")} options={chartOptions("Effectiveness")} /></div><p><strong>Conclusion:</strong> Effectiveness shows trade-off with increased flow as contact time reduces.</p></Card.Body></Card></Col>
            </Row>
            <Row>
              <Col md={12}><Card style={styles.card}><Card.Body><Card.Title>Q Hot vs Q Cold</Card.Title><div style={styles.chart}><Bar data={barData} options={chartOptions("Q Comparison")} /></div><p><strong>Conclusion:</strong> Slight differences in Qh and Qc suggest minimal system losses due to radiation/conduction.</p></Card.Body></Card></Col>
            </Row>
          </div>
        </>
      )}
    </div>
  );
}
