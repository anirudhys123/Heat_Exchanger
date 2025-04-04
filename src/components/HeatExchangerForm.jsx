import React, { useState } from "react";
import { Table, Button, Row, Col } from "react-bootstrap";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function HeatExchangerForm() {
  const cp = 4187; // J/kg°C
  const A = 0.278; // Fixed area

  const [readings, setReadings] = useState([
    { mh: 0.22, mc: 0.19, Th_in: 78, Th_out: 65, Tc_in: 29, Tc_out: 46 },
    { mh: 0.25, mc: 0.20, Th_in: 85, Th_out: 70, Tc_in: 30, Tc_out: 50 },
    { mh: 0.30, mc: 0.22, Th_in: 90, Th_out: 75, Tc_in: 35, Tc_out: 55 },
  ]);

  const [results, setResults] = useState([]);

  const calculate = () => {
    const newResults = readings.map((r) => {
      const Qh = r.mh * cp * (r.Th_in - r.Th_out);
      const Qc = r.mc * cp * (r.Tc_out - r.Tc_in);
      const Q = (Qh + Qc) / 2;

      const deltaT1 = r.Th_in - r.Tc_out;
      const deltaT2 = r.Th_out - r.Tc_in;
      const LMTD = Math.abs(deltaT1 - deltaT2) < 1e-6
        ? deltaT1
        : (deltaT1 - deltaT2) / Math.log(deltaT1 / deltaT2);

      const U = Q / (A * LMTD);

      return {
        ...r,
        Q,
        Qh,
        Qc,
        deltaT1,
        deltaT2,
        LMTD,
        U,
      };
    });

    setResults(newResults);
  };

  const xLabels = results.map((r, idx) => `R${idx + 1} (ṁₕ ${r.mh} kg/s)`);

  const chartData = (label, key, color) => ({
    labels: xLabels,
    datasets: [{
      label,
      data: results.map(r => r[key]),
      borderColor: color,
      backgroundColor: color,
      pointBackgroundColor: 'white',
      pointBorderColor: color,
      pointRadius: 5,
      pointHoverRadius: 7,
      borderWidth: 3,
      fill: false,
      tension: 0.4
    }],
  });

  const chartOptions = (label) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          font: {
            size: 14
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            return `${context.dataset.label}: ${context.parsed.y.toFixed(2)}`;
          }
        }
      },
      title: {
        display: true,
        text: label,
        font: {
          size: 18
        },
        padding: {
          top: 10,
          bottom: 20
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Readings (ṁₕ)',
          font: {
            size: 16
          }
        },
        ticks: {
          font: {
            size: 13
          }
        },
        grid: {
          display: true,
          color: '#ddd'
        }
      },
      y: {
        title: {
          display: true,
          text: label,
          font: {
            size: 16
          }
        },
        ticks: {
          font: {
            size: 13
          }
        },
        grid: {
          display: true,
          color: '#ddd'
        }
      }
    }
  });

  return (
    <div style={{ padding: '2rem', backgroundColor: '#f9f9f9' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>Double Pipe Heat Exchanger Analysis</h2>

      <Table bordered responsive>
        <thead>
          <tr>
            <th>Parameter</th>
            {readings.map((_, idx) => <th key={idx}>Reading {idx + 1}</th>)}
          </tr>
        </thead>
        <tbody>
          {['mh', 'mc', 'Th_in', 'Th_out', 'Tc_in', 'Tc_out'].map((param, i) => (
            <tr key={i}>
              <td>{param}</td>
              {readings.map((r, idx) => (
                <td key={idx}>
                  <input
                    type="number"
                    value={r[param]}
                    onChange={(e) => {
                      const newReadings = [...readings];
                      newReadings[idx][param] = parseFloat(e.target.value);
                      setReadings(newReadings);
                    }}
                    className="form-control"
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </Table>

      <Row className="my-3">
        <Col md={4}>
          <label><strong>Area (A):</strong> 0.278 m² (Fixed)</label>
        </Col>
        <Col md={4}>
          <Button onClick={calculate} variant="primary" style={{ marginTop: '1.8rem' }}>Compute</Button>
        </Col>
      </Row>

      {results.length > 0 && (
        <>
          <h4 className="mt-4">Results</h4>
          <Table bordered responsive>
            <thead>
              <tr>
                <th>ṁₕ (kg/s)</th>
                <th>ṁ𝒸 (kg/s)</th>
                <th>Qₕ (W)</th>
                <th>Q𝒸 (W)</th>
                <th>Q = (Qh+Qc)/2 (W)</th>
                <th>ΔT₁ (°C)</th>
                <th>ΔT₂ (°C)</th>
                <th>LMTD (°C)</th>
                <th>U (W/m²°C)</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => (
                <tr key={i}>
                  <td>{r.mh}</td>
                  <td>{r.mc}</td>
                  <td>{r.Q.toFixed(2)}</td>
                  <td>{r.Qh.toFixed(2)}</td>
                  <td>{r.Qc.toFixed(2)}</td>
                  <td>{r.deltaT1.toFixed(2)}</td>
                  <td>{r.deltaT2.toFixed(2)}</td>
                  <td>{r.LMTD.toFixed(2)}</td>
                  <td>{r.U.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </Table>

          <h4 className="mt-4">Graphs</h4>
          <Row>
            <Col md={6} style={{ height: '350px', marginBottom: '2rem' }}>
              <Line data={chartData("Heat Transfer Rate (Q)", "Q", "blue")} options={chartOptions("Heat Transfer Rate (Q)")} />
            </Col>
            <Col md={6} style={{ height: '350px', marginBottom: '2rem' }}>
              <Line data={chartData("Overall Heat Transfer Coefficient (U)", "U", "green")} options={chartOptions("Overall Heat Transfer Coefficient (U)")} />
            </Col>
            <Col md={6} style={{ height: '350px', marginBottom: '2rem' }}>
              <Line data={chartData("Log Mean Temperature Difference (LMTD)", "LMTD", "orange")} options={chartOptions("Log Mean Temperature Difference (LMTD)")} />
            </Col>
          </Row>
        </>
      )}
    </div>
  );
}
