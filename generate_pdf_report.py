import os
import re
import subprocess
import sys

def build_html_report():
    html = r"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>CampusFlix - IEEE Project Report</title>
<style>
  @page {
    size: A4;
    margin: 22mm 18mm 22mm 18mm;
    @bottom-right {
      content: counter(page);
    }
  }

  body {
    font-family: 'Times New Roman', Times, serif;
    font-size: 11.5pt;
    line-height: 1.5;
    color: #111111;
    margin: 0;
    padding: 0;
    text-align: justify;
  }

  .page-break {
    page-break-before: always;
    break-before: page;
  }

  .avoid-break {
    page-break-inside: avoid;
    break-inside: avoid;
  }

  /* Cover Page Styling */
  .cover-page {
    text-align: center;
    padding-top: 30px;
    height: 950px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .inst-title {
    font-size: 18pt;
    font-weight: bold;
    text-transform: uppercase;
    color: #0b2545;
    margin-bottom: 5px;
  }

  .inst-sub {
    font-size: 11pt;
    color: #444;
    margin-bottom: 25px;
  }

  .proj-title {
    font-size: 22pt;
    font-weight: bold;
    color: #990000;
    margin: 30px 0 10px 0;
    line-height: 1.25;
    text-transform: uppercase;
  }

  .proj-sub {
    font-size: 13pt;
    font-weight: normal;
    color: #333;
    margin-bottom: 40px;
    line-height: 1.4;
  }

  .report-label {
    font-size: 12pt;
    font-style: italic;
    margin-bottom: 30px;
  }

  .author-block {
    margin: 30px 0;
    font-size: 12pt;
  }

  .author-name {
    font-size: 14pt;
    font-weight: bold;
    color: #111;
  }

  .guide-block {
    margin: 20px 0;
    font-size: 12pt;
  }

  .dept-info {
    font-size: 12pt;
    font-weight: bold;
    margin-top: 30px;
    border-top: 1.5px solid #0b2545;
    padding-top: 15px;
  }

  /* Academic Headers */
  h1.chapter-title {
    font-size: 18pt;
    font-weight: bold;
    color: #0b2545;
    text-transform: uppercase;
    border-bottom: 2px solid #0b2545;
    padding-bottom: 6px;
    margin-top: 0;
    margin-bottom: 20px;
  }

  h2.sec-title {
    font-size: 14pt;
    font-weight: bold;
    color: #1a365d;
    margin-top: 22px;
    margin-bottom: 10px;
    border-left: 4px solid #990000;
    padding-left: 8px;
  }

  h3.subsec-title {
    font-size: 12pt;
    font-weight: bold;
    color: #2b6cb0;
    margin-top: 16px;
    margin-bottom: 8px;
  }

  p {
    margin-top: 0;
    margin-bottom: 12px;
    text-indent: 20px;
  }

  p.no-indent {
    text-indent: 0;
  }

  /* Academic Tables */
  table.academic-table {
    width: 100%;
    border-collapse: collapse;
    margin: 18px 0;
    font-size: 10pt;
    page-break-inside: avoid;
  }

  table.academic-table th, table.academic-table td {
    border: 1px solid #718096;
    padding: 7px 9px;
    text-align: left;
  }

  table.academic-table th {
    background-color: #f7fafc;
    color: #1a202c;
    font-weight: bold;
    border-bottom: 2px solid #2d3748;
  }

  table.academic-table tr:nth-child(even) {
    background-color: #fcfcfc;
  }

  .caption {
    font-size: 10pt;
    font-weight: bold;
    text-align: center;
    margin: 8px 0 16px 0;
    color: #4a5568;
  }

  /* Mathematical Equation Styling */
  .equation-box {
    background-color: #f8fafc;
    border-left: 3px solid #3182ce;
    padding: 10px 15px;
    margin: 14px 0;
    font-family: 'Cambria Math', 'Times New Roman', serif;
    font-size: 11pt;
    text-align: center;
  }

  .equation-number {
    float: right;
    font-weight: bold;
  }

  /* Code Block Styling */
  pre.code-snippet {
    background-color: #1e1e1e;
    color: #d4d4d4;
    padding: 10px 14px;
    border-radius: 4px;
    font-family: 'Consolas', 'Courier New', monospace;
    font-size: 8.5pt;
    line-height: 1.35;
    overflow-x: hidden;
    white-space: pre-wrap;
    margin: 14px 0;
    border: 1px solid #333;
  }

  /* Certificate / Formal Pages */
  .cert-container {
    padding: 30px 20px;
    border: 4px double #0b2545;
    height: 870px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .cert-header {
    text-align: center;
  }

  .cert-title {
    font-size: 20pt;
    font-weight: bold;
    text-transform: uppercase;
    color: #0b2545;
    margin-bottom: 20px;
    letter-spacing: 2px;
  }

  .cert-body {
    font-size: 12pt;
    line-height: 1.8;
    text-align: justify;
    margin: 20px 0;
  }

  .sig-grid {
    display: flex;
    justify-content: space-between;
    margin-top: 40px;
  }

  .sig-cell {
    text-align: center;
    width: 30%;
  }

  .sig-line {
    border-top: 1px solid #333;
    margin-top: 50px;
    padding-top: 6px;
    font-weight: bold;
    font-size: 10.5pt;
  }

  /* Diagram Box */
  .diagram-box {
    border: 1px solid #cbd5e0;
    background: #edf2f7;
    padding: 15px;
    border-radius: 6px;
    margin: 15px 0;
    font-family: 'Courier New', monospace;
    font-size: 9pt;
    line-height: 1.25;
    color: #1a202c;
    white-space: pre;
    overflow: hidden;
  }

  .toc-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 6px;
    font-size: 11pt;
  }

  .toc-dots {
    flex-grow: 1;
    border-bottom: 1px dotted #718096;
    margin: 0 8px 4px 8px;
  }
</style>
</head>
<body>

<!-- ======================================================== -->
<!-- COVER PAGE                                               -->
<!-- ======================================================== -->
<div class="cover-page">
  <div class="cert-header">
    <div class="inst-title">MIT Academy of Engineering</div>
    <div class="inst-sub">(An Autonomous Institute Affiliated to Savitribai Phule Pune University)<br>Alandi (D.), Pune, Maharashtra – 412105</div>
    <hr style="border: 0; border-top: 2px solid #0b2545; width: 85%; margin: 15px auto;">
    
    <div class="report-label">A Capstone Engineering Project Report on</div>
    
    <div class="proj-title">CAMPUSFLIX</div>
    <div class="proj-sub">Intelligent Lost & Found Campus Connect Portal Utilizing Multi-Factor Heuristic Matching, 3D WebGL Holographic Visualization, and QR-Based Physical Verification</div>
  </div>

  <div class="author-block">
    <p class="no-indent" style="text-align:center;">Submitted in partial fulfillment of the requirements for the degree of<br><strong>Bachelor of Technology in Computer Engineering</strong></p>
    <br>
    <p class="no-indent" style="text-align:center;"><em>Submitted by:</em><br>
    <span class="author-name">Karthik J. Pillai</span><br>
    <span>PRN: 202201040082 | Roll No: TY-COMP-B-42</span></p>
  </div>

  <div class="guide-block">
    <p class="no-indent" style="text-align:center;"><em>Under the Guidance of:</em><br>
    <strong>Prof. Department Faculty Coordinator</strong><br>
    <span>Department of Computer Engineering, MITAOE, Pune</span></p>
  </div>

  <div class="dept-info">
    DEPARTMENT OF COMPUTER ENGINEERING<br>
    ACADEMIC YEAR 2025 – 2026
  </div>
</div>

<!-- ======================================================== -->
<!-- CERTIFICATE                                              -->
<!-- ======================================================== -->
<div class="page-break"></div>
<div class="cert-container">
  <div class="cert-header">
    <div class="inst-title">MIT Academy of Engineering, Pune</div>
    <div style="font-size: 11pt; color: #4a5568;">Department of Computer Engineering</div>
    <div class="cert-title" style="margin-top: 25px;">CERTIFICATE OF APPROVAL</div>
  </div>

  <div class="cert-body">
    This is to certify that the project report entitled <strong>"CAMPUSFLIX: Intelligent Lost & Found Campus Connect Portal Utilizing Multi-Factor Heuristic Matching, 3D WebGL Holographic Visualization, and QR-Based Physical Verification"</strong> submitted by <strong>Karthik J. Pillai</strong> (PRN: 202201040082) is a bonafide record of work carried out under our supervision and guidance in partial fulfillment of the requirements for the degree of <strong>Bachelor of Technology in Computer Engineering</strong> at MIT Academy of Engineering, Alandi (D.), Pune during the academic year 2025–2026.
    <br><br>
    The project report has been examined and approved as satisfying the academic standards prescribed by the University and the Departmental Evaluation Committee.
  </div>

  <div class="sig-grid">
    <div class="sig-cell">
      <div class="sig-line">Internal Project Guide<br>Dept. of Computer Engg.</div>
    </div>
    <div class="sig-cell">
      <div class="sig-line">Head of Department<br>Dept. of Computer Engg.</div>
    </div>
    <div class="sig-cell">
      <div class="sig-line">External Examiner<br>University Nominee</div>
    </div>
  </div>

  <div style="text-align: left; font-size: 10pt; margin-top: 25px;">
    <strong>Date:</strong> 24th November 2026<br>
    <strong>Place:</strong> Pune, India
  </div>
</div>

<!-- ======================================================== -->
<!-- DECLARATION                                              -->
<!-- ======================================================== -->
<div class="page-break"></div>
<div class="cert-container">
  <div class="cert-header">
    <div class="cert-title" style="margin-top: 15px;">CANDIDATE'S DECLARATION</div>
  </div>

  <div class="cert-body">
    I hereby declare that the project work entitled <strong>"CAMPUSFLIX: Intelligent Lost & Found Campus Connect Portal"</strong> submitted to the Department of Computer Engineering, MIT Academy of Engineering, Pune, is an original compilation of development, research, and testing executed by me under the guidance of the faculty project guide.
    <br><br>
    I further declare that this work has not been submitted previously to any other university, institute, or organization for the award of any degree, diploma, fellowship, or other similar title or recognition.
    <br><br>
    All sources of literature, theoretical frameworks, software libraries, and data models incorporated into this work have been duly acknowledged and cited in accordance with standard academic ethics and IEEE reference formats.
  </div>

  <div style="margin-top: 100px; text-align: right;">
    <div style="display: inline-block; text-align: center; width: 250px;">
      <div style="border-top: 1px solid #333; padding-top: 5px;">
        <strong>Karthik J. Pillai</strong><br>
        PRN: 202201040082<br>
        Dept. of Computer Engineering<br>
        MIT Academy of Engineering, Pune
      </div>
    </div>
  </div>

  <div style="text-align: left; font-size: 10pt; margin-top: 30px;">
    <strong>Date:</strong> 24th November 2026<br>
    <strong>Place:</strong> Pune, India
  </div>
</div>

<!-- ======================================================== -->
<!-- ACKNOWLEDGEMENTS                                         -->
<!-- ======================================================== -->
<div class="page-break"></div>
<h1 class="chapter-title">Acknowledgements</h1>

<p>I express my deepest sense of gratitude and respect to my project guide and faculty coordinators in the Department of Computer Engineering at <strong>MIT Academy of Engineering (MITAOE), Pune</strong>, whose insightful suggestions, technical guidance, and constructive critiques made the successful conceptualization, architecture, and deployment of <strong>CampusFlix</strong> possible.</p>

<p>I would like to convey my sincere gratitude to the <strong>Head of the Department of Computer Engineering</strong> for providing uninterrupted access to state-of-the-art laboratory infrastructure, cloud sandbox environments, and developer resources necessary for end-to-end full-stack testing.</p>

<p>I also extend my sincere thanks to the <strong>Executive Director and Principal of MITAOE</strong> for fostering an innovative academic environment centered on practical problem-solving that directly addresses campus operational challenges.</p>

<p>Special thanks are due to campus security personnel, administrative staff, and fellow student peers who participated in the user experience evaluation and assisted in testing real-world claim verification workflows. Finally, I thank my parents and colleagues for their constant encouragement and unwavering moral support throughout this engineering pursuit.</p>

<div style="margin-top: 40px; text-align: right;">
  <strong>Karthik J. Pillai</strong><br>
  B.Tech Computer Engineering<br>
  MIT Academy of Engineering, Pune
</div>

<!-- ======================================================== -->
<!-- ABSTRACT                                                 -->
<!-- ======================================================== -->
<div class="page-break"></div>
<h1 class="chapter-title">Abstract</h1>

<p>Misplacement of valuable personal belongings—including scientific calculators, hostel room keys, wallets, student identification credentials, laptops, water bottles, and accessories—represents an endemic operational friction point across university campuses. Conventional mitigation mechanisms, such as manual physical security registers and unorganized social messaging channels (e.g., WhatsApp, Telegram), suffer from fundamental structural limitations: poor discoverability, spatial isolation, high latency, total absence of automated counterpart discovery, high vulnerability to fraudulent ownership claims, and the permanent abandonment of unresolved cases.</p>

<p>To definitively address these challenges, this project introduces <strong>CampusFlix</strong>, an enterprise-grade, intelligent Lost and Found Campus Connect Portal engineered with a modern full-stack decoupled architecture comprising React 18, Vite, Three.js, Node.js, Express.js, and MongoDB Atlas with automated in-memory dual-mode failover.</p>

<p>The primary contributions of CampusFlix encompass:</p>
<ol>
  <li><strong>Intelligent Multi-Factor Matching Engine</strong>: Implements a 5-factor calibrated heuristic compatibility algorithm (incorporating Item Name Token Overlap and Dice Bigram Coefficient at 35%, Category Taxonomy at 20%, Description Jaccard Coefficient at 20%, Campus Landmark Recognition at 15%, and Temporal Proximity at 10%) producing stratified match confidence percentages;</li>
  <li><strong>Explainable Factor Breakdown</strong>: Transparently delineates exactly why two counterpart reports were paired while enforcing privacy disclaimers;</li>
  <li><strong>Duplicate Report Detection System</strong>: Intercepts potential duplicate reporting using heuristic thresholds ($S_{\text{dup}} \ge 68\%$) without revealing private reporter data;</li>
  <li><strong>Cryptographic Nonce-Based QR Handover Protocol</strong>: Decouples administrative claim approval from physical handover verification at campus security desks, preventing fraudulent claims and replay attacks;</li>
  <li><strong>Automated Temporal Lifecycle Scheduler</strong>: Employs background node-cron daemons executing progressive Day 1, 3, 7, and 14 notification escalations for lingering unresolved items;</li>
  <li><strong>Interactive WebGL Holographic Visualizer</strong>: Leverages Three.js to render real-time interactive 3D visualizations of reported belongings; and</li>
  <li><strong>Live Database-Driven Analytics & Campus Map</strong>: Offers real-time administrative intelligence and a 9-zone interactive campus hotspot schematic map.</li>
</ol>

<p>The system was subjected to rigorous empirical verification comprising 39 end-to-end automated test scenarios (14 baseline regression scenarios and 25 enhancement scenarios), achieving a 100% pass rate. CampusFlix bridges the trust and information asymmetry between losers and finders, delivering a secure, automated, and streamlined campus ecosystem.</p>

<p class="no-indent" style="margin-top: 20px;"><strong>Keywords:</strong> <em>Lost and Found Systems, Multi-Factor Heuristic Matching, Jaccard Similarity, WebGL, Three.js, QR-Based Verification, Role-Based Access Control, MERN Architecture, Campus Automation, node-cron.</em></p>

<!-- ======================================================== -->
<!-- TABLE OF CONTENTS                                        -->
<!-- ======================================================== -->
<div class="page-break"></div>
<h1 class="chapter-title">Table of Contents</h1>

<div class="toc-row"><span><strong>Certificate of Approval</strong></span><span class="toc-dots"></span><span>ii</span></div>
<div class="toc-row"><span><strong>Candidate's Declaration</strong></span><span class="toc-dots"></span><span>iii</span></div>
<div class="toc-row"><span><strong>Acknowledgements</strong></span><span class="toc-dots"></span><span>iv</span></div>
<div class="toc-row"><span><strong>Abstract</strong></span><span class="toc-dots"></span><span>v</span></div>
<div class="toc-row"><span><strong>List of Figures</strong></span><span class="toc-dots"></span><span>viii</span></div>
<div class="toc-row"><span><strong>List of Tables</strong></span><span class="toc-dots"></span><span>ix</span></div>

<div class="toc-row" style="margin-top: 15px;"><span><strong>CHAPTER 1: INTRODUCTION</strong></span><span class="toc-dots"></span><span><strong>1</strong></span></div>
<div class="toc-row" style="padding-left: 20px;"><span>1.1 Background and Institutional Context</span><span class="toc-dots"></span><span>1</span></div>
<div class="toc-row" style="padding-left: 20px;"><span>1.2 Problem Statement & Critical Deficiencies</span><span class="toc-dots"></span><span>2</span></div>
<div class="toc-row" style="padding-left: 20px;"><span>1.3 Proposed System: CampusFlix</span><span class="toc-dots"></span><span>3</span></div>
<div class="toc-row" style="padding-left: 20px;"><span>1.4 Objectives and Core Technical Goals</span><span class="toc-dots"></span><span>4</span></div>
<div class="toc-row" style="padding-left: 20px;"><span>1.5 Scope, Boundaries, and Limitations</span><span class="toc-dots"></span><span>5</span></div>
<div class="toc-row" style="padding-left: 20px;"><span>1.6 Report Organization</span><span class="toc-dots"></span><span>5</span></div>

<div class="toc-row" style="margin-top: 15px;"><span><strong>CHAPTER 2: LITERATURE SURVEY & FEASIBILITY ANALYSIS</strong></span><span class="toc-dots"></span><span><strong>6</strong></span></div>
<div class="toc-row" style="padding-left: 20px;"><span>2.1 Review of Contemporary Lost and Found Approaches</span><span class="toc-dots"></span><span>6</span></div>
<div class="toc-row" style="padding-left: 20px;"><span>2.2 Text Retrieval and String Similarity Algorithms</span><span class="toc-dots"></span><span>7</span></div>
<div class="toc-row" style="padding-left: 20px;"><span>2.3 3D Graphics and Interactive WebGL Technologies</span><span class="toc-dots"></span><span>8</span></div>
<div class="toc-row" style="padding-left: 20px;"><span>2.4 Cryptographic Verification in Physical Handover</span><span class="toc-dots"></span><span>9</span></div>
<div class="toc-row" style="padding-left: 20px;"><span>2.5 Technical, Operational, and Economic Feasibility</span><span class="toc-dots"></span><span>10</span></div>

<div class="toc-row" style="margin-top: 15px;"><span><strong>CHAPTER 3: SYSTEM REQUIREMENTS & SPECIFICATIONS</strong></span><span class="toc-dots"></span><span><strong>11</strong></span></div>
<div class="toc-row" style="padding-left: 20px;"><span>3.1 User Personas and Stakeholder Identification</span><span class="toc-dots"></span><span>11</span></div>
<div class="toc-row" style="padding-left: 20px;"><span>3.2 Functional Requirements Specifications</span><span class="toc-dots"></span><span>12</span></div>
<div class="toc-row" style="padding-left: 20px;"><span>3.3 Non-Functional Requirements Specifications</span><span class="toc-dots"></span><span>14</span></div>
<div class="toc-row" style="padding-left: 20px;"><span>3.4 Hardware, Software, and Network Prerequisites</span><span class="toc-dots"></span><span>15</span></div>

<div class="toc-row" style="margin-top: 15px;"><span><strong>CHAPTER 4: SYSTEM ARCHITECTURE & DETAILED DESIGN</strong></span><span class="toc-dots"></span><span><strong>16</strong></span></div>
<div class="toc-row" style="padding-left: 20px;"><span>4.1 High-Level Architectural Framework (Three-Tier MERN)</span><span class="toc-dots"></span><span>16</span></div>
<div class="toc-row" style="padding-left: 20px;"><span>4.2 Data Flow Modeling (Level 0, Level 1, Level 2 DFDs)</span><span class="toc-dots"></span><span>17</span></div>
<div class="toc-row" style="padding-left: 20px;"><span>4.3 Relational and Document Schema Design (ER Modeling)</span><span class="toc-dots"></span><span>18</span></div>
<div class="toc-row" style="padding-left: 20px;"><span>4.4 Mathematical Model of Heuristic Multi-Factor Matching</span><span class="toc-dots"></span><span>19</span></div>
<div class="toc-row" style="padding-left: 20px;"><span>4.5 Mathematical Formulation of Duplicate Detection</span><span class="toc-dots"></span><span>21</span></div>
<div class="toc-row" style="padding-left: 20px;"><span>4.6 QR Handover Cryptographic Security Architecture</span><span class="toc-dots"></span><span>22</span></div>
<div class="toc-row" style="padding-left: 20px;"><span>4.7 Temporal Escalation Engine (node-cron Lifecycle)</span><span class="toc-dots"></span><span>23</span></div>

<div class="toc-row" style="margin-top: 15px;"><span><strong>CHAPTER 5: IMPLEMENTATION METHODOLOGY & MODULES</strong></span><span class="toc-dots"></span><span><strong>24</strong></span></div>
<div class="toc-row" style="padding-left: 20px;"><span>5.1 Presentation Subsystem Implementation</span><span class="toc-dots"></span><span>24</span></div>
<div class="toc-row" style="padding-left: 20px;"><span>5.2 WebGL 3D Holographic Rendering Pipeline</span><span class="toc-dots"></span><span>25</span></div>
<div class="toc-row" style="padding-left: 20px;"><span>5.3 RESTful API & Security Middleware Stack</span><span class="toc-dots"></span><span>26</span></div>
<div class="toc-row" style="padding-left: 20px;"><span>5.4 Dual-Mode Storage Engine & Failover Handler</span><span class="toc-dots"></span><span>27</span></div>

<div class="toc-row" style="margin-top: 15px;"><span><strong>CHAPTER 6: TESTING, VERIFICATION & EXPERIMENTAL RESULTS</strong></span><span class="toc-dots"></span><span><strong>28</strong></span></div>
<div class="toc-row" style="padding-left: 20px;"><span>6.1 Testing Methodology and Framework</span><span class="toc-dots"></span><span>28</span></div>
<div class="toc-row" style="padding-left: 20px;"><span>6.2 Baseline Regression Test Suite Results (14 Scenarios)</span><span class="toc-dots"></span><span>29</span></div>
<div class="toc-row" style="padding-left: 20px;"><span>6.3 Final Enhancement Verification Results (25 Scenarios)</span><span class="toc-dots"></span><span>30</span></div>
<div class="toc-row" style="padding-left: 20px;"><span>6.4 Comprehensive Verification Matrix (39/39 Passing)</span><span class="toc-dots"></span><span>31</span></div>
<div class="toc-row" style="padding-left: 20px;"><span>6.5 Performance Benchmarks & Build Size Metrics</span><span class="toc-dots"></span><span>32</span></div>

<div class="toc-row" style="margin-top: 15px;"><span><strong>CHAPTER 7: USER INTERFACE & SCREEN PROGRESSION</strong></span><span class="toc-dots"></span><span><strong>33</strong></span></div>
<div class="toc-row" style="padding-left: 20px;"><span>7.1 Homepage Hero Billboard and Ambient Feed</span><span class="toc-dots"></span><span>33</span></div>
<div class="toc-row" style="padding-left: 20px;"><span>7.2 Found Reporting, Smart Matches, & Duplicate Warning</span><span class="toc-dots"></span><span>34</span></div>
<div class="toc-row" style="padding-left: 20px;"><span>7.3 Campus Map, Personal Dashboard, & Handover Scanner</span><span class="toc-dots"></span><span>35</span></div>

<div class="toc-row" style="margin-top: 15px;"><span><strong>CHAPTER 8: CONCLUSION AND FUTURE SCOPE</strong></span><span class="toc-dots"></span><span><strong>36</strong></span></div>
<div class="toc-row" style="padding-left: 20px;"><span>8.1 Summary of Contributions</span><span class="toc-dots"></span><span>36</span></div>
<div class="toc-row" style="padding-left: 20px;"><span>8.2 Practical Limitations</span><span class="toc-dots"></span><span>36</span></div>
<div class="toc-row" style="padding-left: 20px;"><span>8.3 Future Work & Enhancements</span><span class="toc-dots"></span><span>37</span></div>

<div class="toc-row" style="margin-top: 15px;"><span><strong>REFERENCES & BIBLIOGRAPHY</strong></span><span class="toc-dots"></span><span><strong>38</strong></span></div>

<!-- ======================================================== -->
<!-- LIST OF FIGURES & TABLES                                 -->
<!-- ======================================================== -->
<div class="page-break"></div>
<h1 class="chapter-title">List of Figures & Tables</h1>

<h2 class="sec-title">List of Figures</h2>
<div class="toc-row"><span>Figure 1.1: Functional Flow of Lost & Found Connect Lifecycle</span><span class="toc-dots"></span><span>3</span></div>
<div class="toc-row"><span>Figure 3.1: Use Case Diagram for Student, Staff, and Administrator Roles</span><span class="toc-dots"></span><span>12</span></div>
<div class="toc-row"><span>Figure 4.1: Three-Tier Decoupled MERN Architecture of CampusFlix</span><span class="toc-dots"></span><span>16</span></div>
<div class="toc-row"><span>Figure 4.2: Data Flow Diagram (Level 0 Context Diagram)</span><span class="toc-dots"></span><span>17</span></div>
<div class="toc-row"><span>Figure 4.3: Data Flow Diagram (Level 1 Subsystem Flow)</span><span class="toc-dots"></span><span>18</span></div>
<div class="toc-row"><span>Figure 4.4: Entity-Relationship Diagram for CampusFlix Data Collections</span><span class="toc-dots"></span><span>19</span></div>
<div class="toc-row"><span>Figure 4.5: Multi-Factor Heuristic Matching Formulation Flow</span><span class="toc-dots"></span><span>20</span></div>
<div class="toc-row"><span>Figure 4.6: Sequence Diagram of Cryptographic QR Handover Protocol</span><span class="toc-dots"></span><span>22</span></div>
<div class="toc-row"><span>Figure 4.7: State Transition Diagram of Temporal Unresolved Milestones</span><span class="toc-dots"></span><span>23</span></div>
<div class="toc-row"><span>Figure 5.1: WebGL Holographic 3D Pipeline in Three.js</span><span class="toc-dots"></span><span>25</span></div>
<div class="toc-row"><span>Figure 7.1: Interactive Campus Map with 9 Landmark Hotspot Visualizers</span><span class="toc-dots"></span><span>35</span></div>

<h2 class="sec-title" style="margin-top: 30px;">List of Tables</h2>
<div class="toc-row"><span>Table 2.1: Comparative Analysis of String Similarity Algorithms</span><span class="toc-dots"></span><span>7</span></div>
<div class="toc-row"><span>Table 2.2: Feasibility Matrix Across Critical Engineering Dimensions</span><span class="toc-dots"></span><span>10</span></div>
<div class="toc-row"><span>Table 3.1: Hardware and Software Specification Environment</span><span class="toc-dots"></span><span>15</span></div>
<div class="toc-row"><span>Table 4.1: Calibrated Factor Weightings for Multi-Factor Matching Engine</span><span class="toc-dots"></span><span>20</span></div>
<div class="toc-row"><span>Table 4.2: Temporal Escalation Milestone Schedule Matrix</span><span class="toc-dots"></span><span>24</span></div>
<div class="toc-row"><span>Table 6.1: Baseline Functional Regression Suite Execution Matrix (14 Scenarios)</span><span class="toc-dots"></span><span>29</span></div>
<div class="toc-row"><span>Table 6.2: Enhancement Verification Suite Execution Matrix (25 Scenarios)</span><span class="toc-dots"></span><span>30</span></div>
<div class="toc-row"><span>Table 6.3: Comparative Architectural Evaluation Against Existing Systems</span><span class="toc-dots"></span><span>31</span></div>
<div class="toc-row"><span>Table 6.4: System Performance Benchmarks & Network Payload Metrics</span><span class="toc-dots"></span><span>32</span></div>

<!-- ======================================================== -->
<!-- CHAPTER 1: INTRODUCTION                                  -->
<!-- ======================================================== -->
<div class="page-break"></div>
<h1 class="chapter-title">Chapter 1: Introduction</h1>

<h2 class="sec-title">1.1 Background and Institutional Context</h2>
<p>Modern engineering university campuses represent dense micro-communities encompassing several thousand undergraduate students, postgraduate scholars, faculty researchers, administrative personnel, and visiting professionals. In this active academic environment—marked by continuous transitions between lecture amphitheaters, digital electronics laboratories, central library reading zones, sporting pavilions, hostel complexes, and recreational dining halls—the inadvertent misplacement of personal belongings is an inevitable daily occurrence.</p>

<p>Every academic semester, valuable items including scientific programmable calculators, hostel brass keys, biometric identity cards, laboratory notebooks, laptop chargers, high-end water flasks, spectacles, and electronic accessories are left behind on laboratory workbenches, auditorium seating, and cafeteria counters. The recovery of these articles is critical not only due to their direct monetary replacement value but also because their absence disrupts continuous academic participation (e.g., losing laboratory journals before evaluations or misplaced hostel keys preventing residential access).</p>

<h2 class="sec-title">1.2 Problem Statement & Critical Deficiencies</h2>
<p>Despite the high incidence of misplaced articles, tertiary educational institutions predominantly rely on legacy, fragmented, and ad-hoc recovery processes. These conventional mechanisms suffer from five structural deficiencies:</p>

<ol>
  <li><strong>Spatial Centralization & Inaccessibility</strong>: Physical lost-and-found registers maintained at security desks or department offices require students to physically inspect multiple remote offices during limited operational working hours.</li>
  <li><strong>Zero Automated Counterpart Discovery</strong>: When Student A reports a lost "Black Water Bottle" in the library and Student B deposits a "Black Stainless Flask" at the security cabin, existing systems provide zero automated linkage between these complementary reports.</li>
  <li><strong>Information Decay in Unstructured Social Channels</strong>: Informal WhatsApp and Telegram groups cause critical lost-item appeals to be rapidly buried beneath hundreds of unrelated conversational messages within hours, rendering them undiscoverable.</li>
  <li><strong>Vulnerability to Fraudulent Claims</strong>: Publicly broadcasting exact photographs and descriptions of high-value items enables unscrupulous third parties to claim items without possessing genuine ownership.</li>
  <li><strong>Stale Case Abandonment & Indefinite Linger</strong>: Misplaced items frequently remain in security lockers indefinitely because there is no automated schedule to remind owners or escalate unresolved cases to administration.</li>
</ol>

<h2 class="sec-title">1.3 Proposed System: CampusFlix</h2>
<p>To overcome these systemic bottlenecks, this project develops <strong>CampusFlix</strong>—an intelligent, automated Lost and Found Campus Connect Portal. Taking visual and UX inspiration from modern streaming platforms (the "Netflix dark theme" aesthetic), CampusFlix organizes campus belongings into indexed, highly visual, and easily searchable media cards. Crucially, it replaces passive notice boards with an active, algorithmic matching and verification engine.</p>

<div class="diagram-box">
+-------------------------------------------------------------------------------------------------+
|                                 CAMPUSFLIX CORE FUNCTIONAL FLOW                                 |
+-------------------------------------------------------------------------------------------------+
|  [Student Loses Belonging]               [Finder Discovers Item]                                |
|             |                                       |                                           |
|             v                                       v                                           |
|   (Submits Lost Report)                  (Compulsory Photographic Proof                         |
|   (Photo is Optional)                    + Mandatory Campus Location)                           |
|             |                                       |                                           |
|             +------------------->+<-----------------+                                           |
|                                  |                                                              |
|                                  v                                                              |
|                  [Intelligent Multi-Factor Matching]                                            |
|                  - Item Name Similarity (35%)                                                   |
|                  - Category Affinity (20%)                                                      |
|                  - Description Jaccard Overlap (20%)                                            |
|                  - Campus Location Landmark (15%)                                               |
|                  - Date Proximity Score (10%)                                                   |
|                                  |                                                              |
|                 +----------------+----------------+                                             |
|                 |                                 |                                             |
|                 v                                 v                                             |
|        (Score >= 60% Match)               (Score < 60% Noise)                                   |
|                 |                                 |                                             |
|                 v                                 v                                             |
|     [Dispatches In-App Alerts]           [Retains Report Active]                                |
|     [Generates Smart Explanations]       [Schedules Day 1,3,7,14 Alerts]                        |
|                 |                                                                               |
|                 v                                                                               |
|     [Student Files Ownership Claim]                                                             |
|     (Submits Private Identifying Markings)                                                      |
|                 |                                                                               |
|                 v                                                                               |
|     [Admin Verifies Claim] -> Approved -> [Generates Single-Use Opaque QR]                      |
|                                                   |                                             |
|                                                   v                                             |
|                                     [Campus Security Scans QR Desk]                             |
|                                     -> Physical Handover Confirmed                              |
|                                     -> Item Status Marked "Returned"                            |
+-------------------------------------------------------------------------------------------------+
</div>
<div class="caption">Figure 1.1: Functional Flow of Lost & Found Connect Lifecycle</div>

<h2 class="sec-title">1.4 Objectives and Core Technical Goals</h2>
<p>The primary architectural and engineering objectives of CampusFlix are:</p>
<ul>
  <li><strong>Objective 1: Multi-Factor Heuristic Matching</strong>: Implement an automated NLP-based similarity algorithm calculating bi-directional correlation scores between opposing reports.</li>
  <li><strong>Objective 2: Explainable AI Matching</strong>: Provide transparent factor breakdowns explaining why two items were paired while disclaiming legal ownership proof.</li>
  <li><strong>Objective 3: Photographic Integrity Enforcement</strong>: Require compulsory photographic validation for all found reports to prevent phantom listings.</li>
  <li><strong>Objective 4: Duplicate Report Prevention</strong>: Detect whether a user is reporting an item that already exists in the registry, providing options to view existing reports.</li>
  <li><strong>Objective 5: Cryptographic QR Physical Handover</strong>: Protect the handover lifecycle by generating non-guessable claim nonces and enabling security desk confirmation.</li>
  <li><strong>Objective 6: Automated Temporal Reminders</strong>: Build background scheduling daemons (`node-cron`) for progressive Day 1, 3, 7, and 14 case escalation.</li>
  <li><strong>Objective 7: Interactive 3D WebGL Visualization</strong>: Provide 3D holographic rendering of items using Three.js for interactive spatial examination.</li>
  <li><strong>Objective 8: Real-Time Administrative Analytics</strong>: Aggregate MongoDB data into live KPI recovery metrics, monthly comparisons, and campus hotspot charts.</li>
</ul>

<h2 class="sec-title">1.5 Scope, Boundaries, and Limitations</h2>
<p>CampusFlix is designed specifically for college and university environments. The primary user base encompasses enrolled students, laboratory staff, campus security officers, and administrators. The system restricts physical handover verification to designated institutional checkpoints (e.g., Central Security Desk). It does not handle direct peer-to-peer monetary rewards, focusing exclusively on rapid, secure, and verifiable item restoration.</p>

<h2 class="sec-title">1.6 Report Organization</h2>
<p>The remainder of this report is organized as follows: Chapter 2 discusses the literature survey and feasibility analysis. Chapter 3 outlines detailed functional and non-functional requirements. Chapter 4 provides the mathematical models and system architectural design. Chapter 5 discusses implementation specifics. Chapter 6 details experimental verification across 39 automated scenarios. Chapter 7 presents the user interface and screen progression, and Chapter 8 concludes the report with future research trajectories.</p>

<!-- ======================================================== -->
<!-- CHAPTER 2: LITERATURE SURVEY & FEASIBILITY               -->
<!-- ======================================================== -->
<div class="page-break"></div>
<h1 class="chapter-title">Chapter 2: Literature Survey & Feasibility Analysis</h1>

<h2 class="sec-title">2.1 Review of Contemporary Lost and Found Approaches</h2>
<p>A systematic literature review of automated asset recovery platforms reveals distinct evolutionary phases. Early academic systems utilized relational databases queried via exact SQL keyword pattern matching (`WHERE description LIKE '%calc%'`). These implementations failed when finders and losers utilized distinct vocabulary to describe identical items (e.g., "Casio fx-991EX" vs. "scientific calculator").</p>

<p>Subsequent solutions introduced crowdsourced bulletin boards. However, public bulletin boards introduce severe security vulnerabilities: posting complete photographs and descriptions allows fraudulent claimants to easily guess or mirror identifying features during verification inquiries. CampusFlix addresses this vulnerability by decoupling initial public discovery from private claim adjudication and physical security handovers.</p>

<h2 class="sec-title">2.2 Text Retrieval and String Similarity Algorithms</h2>
<p>Evaluating compatibility between semi-structured user reports necessitates natural language distance metrics. Three primary algorithmic models were evaluated during research:</p>

<table class="academic-table">
  <thead>
    <tr>
      <th>Algorithm</th>
      <th>Mathematical Basis</th>
      <th>Computational Complexity</th>
      <th>CampusFlix Application & Assessment</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Levenshtein Distance</strong></td>
      <td>Minimum single-character edit operations (insertions, deletions, substitutions).</td>
      <td>$O(m \times n)$ dynamic programming matrix.</td>
      <td>Effective for typographical spelling errors in item titles, but computationally expensive for multiline descriptions.</td>
    </tr>
    <tr>
      <td><strong>Sørensen–Dice Coefficient</strong></td>
      <td>Token bigram overlap ratio: $D = \frac{2|X \cap Y|}{|X| + |Y|}$.</td>
      <td>$O(m + n)$ hashing.</td>
      <td><strong>Selected for Item Name Matching</strong> ($f_1$): Highly resilient against character reordering and compound words.</td>
    </tr>
    <tr>
      <td><strong>Jaccard Token Similarity</strong></td>
      <td>Ratio of token intersection over union: $J = \frac{|A \cap B|}{|A \cup B|}$.</td>
      <td>$O(|A| + |B|)$ set operations.</td>
      <td><strong>Selected for Description Matching</strong> ($f_3$): Accurately compares descriptive text after stop-word filtering.</td>
    </tr>
  </tbody>
</table>
<div class="caption">Table 2.1: Comparative Analysis of String Similarity Algorithms</div>

<h2 class="sec-title">2.3 3D Graphics and Interactive WebGL Technologies</h2>
<p>Traditional web platforms rely exclusively on static two-dimensional raster graphics (JPEG, PNG). In lost-and-found contexts, two-dimensional photographs often fail to capture critical structural details (such as back-panel serial stickers, port configurations, or side scratches). WebGL (Web Graphics Library) enables hardware-accelerated 3D graphics inside modern web browsers without third-party plugins. Through Three.js, CampusFlix constructs an interactive holographic rendering pipeline featuring custom lighting, mesh rotation, and spatial zoom controls.</p>

<h2 class="sec-title">2.4 Cryptographic Verification in Physical Handover</h2>
<p>Ensuring that physical custody of a misplaced belonging is granted strictly to the legitimate owner requires an unforgeable verification token. Standard numeric identifiers (such as database auto-incrementing integer IDs `1042`) are vulnerable to sequential guessing attacks. CampusFlix implements cryptographically random alphanumeric claim tokens formatted as `CLM-XXXXXXXX` (derived from 32-bit cryptographically secure pseudorandom nonces). These tokens are encoded into pure vector SVG QR codes, preventing replay attacks and ensuring single-use physical invalidation upon security desk scanning.</p>

<h2 class="sec-title">2.5 Technical, Operational, and Economic Feasibility</h2>
<table class="academic-table">
  <thead>
    <tr>
      <th>Feasibility Dimension</th>
      <th>Evaluation Criteria & Implementation Realization</th>
      <th>Outcome</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Technical Feasibility</strong></td>
      <td>Implemented on standard open-source web technologies: React 18, Node.js, Express.js, MongoDB Atlas. Supported natively across all modern web browsers without proprietary software.</td>
      <td>Highly Feasible</td>
    </tr>
    <tr>
      <td><strong>Operational Feasibility</strong></td>
      <td>Matches existing campus organizational structure: Students report and claim; Campus Security handles physical handovers; Administrators audit unresolved cases. Minimal training required.</td>
      <td>Highly Feasible</td>
    </tr>
    <tr>
      <td><strong>Economic Feasibility</strong></td>
      <td>Zero software licensing expenditures. Runs within MongoDB Atlas free tier (512 MB) and local cloud container environments. High institutional ROI through reduced property loss.</td>
      <td>Highly Feasible</td>
    </tr>
    <tr>
      <td><strong>Schedule Feasibility</strong></td>
      <td>Iteratively developed across 13 modular phases with automated regression testing pipelines, successfully meeting institutional timeline milestones.</td>
      <td>Highly Feasible</td>
    </tr>
  </tbody>
</table>
<div class="caption">Table 2.2: Feasibility Matrix Across Critical Engineering Dimensions</div>

<!-- ======================================================== -->
<!-- CHAPTER 3: SYSTEM REQUIREMENTS                           -->
<!-- ======================================================== -->
<div class="page-break"></div>
<h1 class="chapter-title">Chapter 3: System Requirements & Specifications</h1>

<h2 class="sec-title">3.1 User Personas and Stakeholder Identification</h2>
<p>CampusFlix serves three distinct stakeholder classes with specialized access permissions:</p>
<ol>
  <li><strong>Student Claimant / Finder</strong>: Can report lost belongings, report found items (compulsory image), trigger manual match checks, submit ownership claims, track claim statuses, inspect matching counter-reports, view generated QR codes, and configure notification preferences.</li>
  <li><strong>Campus Security Desk Personnel</strong>: Authenticated staff equipped with the Handover Verification Scanner. Scans or enters claimant QR codes, reviews non-sensitive item metadata, and executes physical handovers that mark items "Returned".</li>
  <li><strong>Campus Administrator</strong>: Oversees campus-wide analytics, monitors unresolved cases across Day 1, 3, 7, and 14 escalation tiers, reviews and approves/rejects claims, triggers manual reminder dispatches, and exports historical audit logs to CSV.</li>
</ol>

<div class="diagram-box">
                    +--------------------------------------------------------+
                    |                CAMPUSFLIX USE CASE MODEL               |
                    +--------------------------------------------------------+
                    
        (Student)
           |----> [Report Lost Item (Optional Photo)]
           |----> [Report Found Item (Compulsory Photo)]
           |----> [Trigger Manual Match Suggestion Check]
           |----> [View Explainable Match Breakdown]
           |----> [Submit Verification Claim]
           |----> [View Approved QR Claim Code]
           |----> [Manage Notification Preferences]
           |----> [Inspect Interactive 9-Zone Campus Map]
           
        (Campus Security Desk)
           |----> [Scan / Input Claim Reference (CLM-XXXXXXXX)]
           |----> [Verify Non-Sensitive Item Summary]
           |----> [Confirm Physical Handover -> Mark Item Returned]
           |----> [Prevent Duplicate Token Replay]
           
        (Administrator)
           |----> [Access Live Database-Driven Analytics]
           |----> [Review Unresolved Dashboard (Day 1, 3, 7, 14 Tiers)]
           |----> [Adjudicate Claims (Approve / Reject)]
           |----> [Trigger Manual Reminder Email / In-App Notification]
           |----> [Export Case Records to Standard CSV]
</div>
<div class="caption">Figure 3.1: Use Case Diagram for Student, Staff, and Administrator Roles</div>

<h2 class="sec-title">3.2 Functional Requirements Specifications</h2>
<ul>
  <li><strong>FR-1: Mandatory Found Item Image Upload</strong>: Found item creation must be strictly rejected on client and server if a valid image is absent. Lost items must allow optional image uploads.</li>
  <li><strong>FR-2: In-Progress Manual Match Check</strong>: The Found item reporting form must not execute matches on keystroke or form mount. The "Find Potential Matches" button must become enabled only when mandatory fields and a valid photo are present, executing matching via explicit click.</li>
  <li><strong>FR-3: Smart Match Explanation</strong>: Match results must present structured bullet points detailing item name, category, description, location, and date affinities, accompanied by an explicit ownership disclaimer.</li>
  <li><strong>FR-4: Duplicate Report Detection</strong>: Prior to saving any report, the system must check for similar existing reports of the same type ($S_{\text{dup}} \ge 68\%$) and show a warning modal with non-sensitive details, permitting the user to continue or view the existing record.</li>
  <li><strong>FR-5: Campus Live Activity Feed</strong>: The homepage must feature a "What's Happening Around Campus?" section with filters for All, Lost, Found, Recently Reported, and Recently Resolved, updating without a full page reload.</li>
  <li><strong>FR-6: Student Personal Dashboard</strong>: Authenticated students must have a dedicated view with 7 operational tabs to track their Lost, Found, Matches, Claims, Notifications, and Returned Belongings.</li>
  <li><strong>FR-7: Interactive Campus Schematic Map</strong>: The portal must render a schematic layout of 9 institutional zones displaying Lost (red) and Found (green) badges with hotspot visualizers.</li>
  <li><strong>FR-8: Cryptographic QR Claim Handover</strong>: Claim approval must generate a unique, non-guessable `CLM-XXXXXXXX` token. Security personnel scan this token to confirm physical handover, transitioning status to "Returned".</li>
  <li><strong>FR-9: User Notification Preferences</strong>: Students must be able to toggle optional alerts (potential matches, unresolved reminders) while keeping security and claim updates mandatory.</li>
  <li><strong>FR-10: Live Database Analytics Dashboard</strong>: Administrators must have real-time aggregations of total lost, found, returned, recovery rates, category distributions, and campus hotspot charts derived directly from MongoDB records.</li>
</ul>

<h2 class="sec-title">3.3 Non-Functional Requirements Specifications</h2>
<ul>
  <li><strong>NFR-1: System Response Latency</strong>: Matching calculations must execute within 150 milliseconds for up to 10,000 active records. API endpoints must respond within 200 milliseconds.</li>
  <li><strong>NFR-2: Dual-Mode Database Resilience</strong>: If MongoDB Atlas is unreachable, the system must fall back to in-memory collections without throwing unhandled exceptions or crashing.</li>
  <li><strong>NFR-3: Role-Based Authorization</strong>: Endpoints modifying items (`PUT`, `DELETE`) or accessing administrative reminders must strictly verify user identity and ownership server-side.</li>
  <li><strong>NFR-4: Rate Limiting & DoS Protection</strong>: Public REST API endpoints must be protected by a sliding-window rate limiter restricting excessive automated requests.</li>
  <li><strong>NFR-5: Data Privacy & Information Masking</strong>: Public feeds and QR scan payloads must never expose private telephone numbers, student emails, or ownership verification answers.</li>
</ul>

<h2 class="sec-title">3.4 Hardware, Software, and Network Prerequisites</h2>
<table class="academic-table">
  <thead>
    <tr>
      <th>Layer / Component</th>
      <th>Development Specification</th>
      <th>Production Deployment Specification</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Client Environment</strong></td>
      <td>Vite 6 HMR Server, React 18.3, Three.js 0.187</td>
      <td>Chrome / Edge / Firefox / Safari (ES2022 compliant)</td>
    </tr>
    <tr>
      <td><strong>Application Server</strong></td>
      <td>Node.js v20.x, Express.js 4.21, Multer 2.5</td>
      <td>Ubuntu 22.04 LTS / Node 20 / PM2 Process Manager</td>
    </tr>
    <tr>
      <td><strong>Database Cluster</strong></td>
      <td>MongoDB Atlas M0 Cloud Cluster (AWS us-east-1)</td>
      <td>MongoDB Atlas Dedicated Tier with Multi-AZ Replication</td>
    </tr>
    <tr>
      <td><strong>Network Protocol</strong></td>
      <td>HTTP/1.1, TCP Port 5000 (API), TCP Port 5173 (UI)</td>
      <td>HTTPS / TLS 1.3, Reverse Proxy via Nginx / Cloudflare</td>
    </tr>
  </tbody>
</table>
<div class="caption">Table 3.1: Hardware and Software Specification Environment</div>

<!-- ======================================================== -->
<!-- CHAPTER 4: SYSTEM DESIGN & ARCHITECTURE                  -->
<!-- ======================================================== -->
<div class="page-break"></div>
<h1 class="chapter-title">Chapter 4: System Architecture & Detailed Design</h1>

<h2 class="sec-title">4.1 High-Level Architectural Framework (Three-Tier MERN)</h2>
<p>CampusFlix adheres to a three-tier decoupled architectural pattern separating client presentation, application routing logic, and persistent storage management.</p>

<div class="diagram-box">
+-------------------------------------------------------------------------------------------------+
|                                 CAMPUSFLIX SYSTEM ARCHITECTURE                                  |
+-------------------------------------------------------------------------------------------------+
|                                                                                                 |
|   +-----------------------------------------------------------------------------------------+   |
|   |                        TIER 1: PRESENTATION LAYER (React 18 SPA)                        |   |
|   |  - Responsive Dark Canvas UI       - Three.js WebGL Holographic 3D Item Viewer          |   |
|   |  - Campus Live Activity Feed       - Interactive 9-Zone Schematic Campus Map            |   |
|   |  - Student Personal Dashboard      - QR Code Generator & Handover Verification Scanner  |   |
|   |  - Live Admin Analytics Visualizer - Smart Match Explanation Accordion                  |   |
|   +--------------------------------------------+--------------------------------------------+   |
|                                                | JSON via RESTful HTTP APIs / CORS              |
|                                                v                                                |
|   +-----------------------------------------------------------------------------------------+   |
|   |                     TIER 2: APPLICATION & LOGIC LAYER (Node/Express)                    |   |
|   |  - RESTful API Router (/api/*)     - Sliding-Window In-Memory Rate Limiter              |   |
|   |  - Server-Side RBAC Auth Guard     - Multer Image Upload (MIME & 5MB Limit Enforcer)    |   |
|   |  - Heuristic Matching Engine       - Duplicate Report Detection Service                 |   |
|   |  - Cryptographic Nonce Generator   - Background node-cron Escalation Daemon             |   |
|   +--------------------------------------------+--------------------------------------------+   |
|                                                | Mongoose ODM / TCP Connection Pool             |
|                                                v                                                |
|   +-----------------------------------------------------------------------------------------+   |
|   |                     TIER 3: DATA & PERSISTENCE LAYER (Dual-Mode)                        |   |
|   |  [PRIMARY] MongoDB Atlas M0 Cloud Cluster (Database: lost_found)                        |   |
|   |            Collections: items, claims, matches, notifications, reminderlogs, preferences|   |
|   |  [FAILOVER] Resilient In-Memory MemoryStore (Zero-Crash Fallback Cache)                 |   |
|   +-----------------------------------------------------------------------------------------+   |
|                                                                                                 |
+-------------------------------------------------------------------------------------------------+
</div>
<div class="caption">Figure 4.1: Three-Tier Decoupled MERN Architecture of CampusFlix</div>

<h2 class="sec-title">4.2 Data Flow Modeling (Level 0, Level 1, Level 2 DFDs)</h2>
<p>The flow of data through CampusFlix is formally illustrated across hierarchical Data Flow Diagrams:</p>

<div class="diagram-box">
[Student User] ----(Item Details + Photo)----> (0.0 CampusFlix) <----(Claim Nonce CLM-XXX)---- [Security Desk]
      |                                              |                                               ^
      |<-------(Match Notifications & QR)------------+-----------------(Verification Summary)-------+
                                                     |
                                                     v
                                         [MongoDB Atlas Database]
</div>
<div class="caption">Figure 4.2: Data Flow Diagram (Level 0 Context Diagram)</div>

<h2 class="sec-title">4.3 Relational and Document Schema Design (ER Modeling)</h2>
<p>Data persistence is managed via five core document schemas optimized with compound indexes:</p>
<ol>
  <li><strong>Item Schema</strong>: `itemName`, `type` (`Lost` | `Found`), `category`, `description`, `location`, `date`, `contact`, `userId`, `imageUrl`, `status` (`Open` | `Claimed` | `Returned`), `needsAttention`. Compound Index: `{ userId: 1, contact: 1 }`, `{ createdAt: -1 }`.</li>
  <li><strong>Claim Schema</strong>: `foundItemId`, `lostItemId`, `claimantId`, `claimantName`, `claimantEmail`, `verificationDetails`, `status` (`pending` | `approved` | `rejected`), `claimReference` (Unique, Sparse Index), `handoverStatus` (`pending_handover` | `handed_over` | `cancelled`), `handoverBy`, `handoverAt`.</li>
  <li><strong>Notification Schema</strong>: `userEmail`, `type`, `title`, `message`, `relatedItemId`, `isRead`, `createdAt`. Index: `{ userEmail: 1, isRead: 1 }`.</li>
  <li><strong>UserPreferences Schema</strong>: `userEmail`, `potentialMatches`, `unresolvedReminders`, `adminAnnouncements`, `claimUpdates` (locked `true`), `securityAlerts` (locked `true`).</li>
  <li><strong>ReminderLog Schema</strong>: `itemId`, `milestone` (`Day 1` | `Day 3` | `Day 7` | `Day 14`), `recipientEmail`, `triggeredBy`, `sentAt`. Index: `{ itemId: 1, milestone: 1 }` (Enforces zero duplicate alerts).</li>
</ol>

<h2 class="sec-title">4.4 Mathematical Model of Heuristic Multi-Factor Matching</h2>
<p>The matching algorithm computes compatibility between target report $T$ and candidate record $C$ of opposing type ($T_{\text{type}} \ne C_{\text{type}}$):</p>

<div class="equation-box">
  <span class="equation-number">(1)</span>
  $$S(T, C) = \min\left(100, \max\left(0, \sum_{i=1}^{5} w_i \cdot f_i(T, C)\right)\right)$$
</div>

<p class="no-indent">Where the weighting vector $w$ is defined as:</p>

<table class="academic-table">
  <thead>
    <tr>
      <th>Factor Index</th>
      <th>Feature Name</th>
      <th>Assigned Weight ($w_i$)</th>
      <th>Mathematical Metric & Evaluation Function</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>$f_1$</td>
      <td>Item Name Similarity</td>
      <td><strong>0.35 (35%)</strong></td>
      <td>$\max(\text{Dice}(\text{bigrams}(T.name), \text{bigrams}(C.name)), \text{SubMatch}(T.name, C.name))$</td>
    </tr>
    <tr>
      <td>$f_2$</td>
      <td>Category Taxonomy Affinity</td>
      <td><strong>0.20 (20%)</strong></td>
      <td>$100 \text{ if exact match}; 50 \text{ if shared hierarchy}; 0 \text{ otherwise}$</td>
    </tr>
    <tr>
      <td>$f_3$</td>
      <td>Description Jaccard Similarity</td>
      <td><strong>0.20 (20%)</strong></td>
      <td>$\text{round}\left(\frac{|\text{Tokens}(T.desc) \cap \text{Tokens}(C.desc)|}{|\text{Tokens}(T.desc) \cup \text{Tokens}(C.desc)|} \times 100\right)$</td>
    </tr>
    <tr>
      <td>$f_4$</td>
      <td>Campus Landmark Recognition</td>
      <td><strong>0.15 (15%)</strong></td>
      <td>$100 \text{ if identical landmark}; 80 \text{ if shared academic zone}; 0 \text{ otherwise}$</td>
    </tr>
    <tr>
      <td>$f_5$</td>
      <td>Date Proximity Function</td>
      <td><strong>0.10 (10%)</strong></td>
      <td>Piecewise temporal step function based on calendar difference $\Delta d$</td>
    </tr>
  </tbody>
</table>
<div class="caption">Table 4.1: Calibrated Factor Weightings for Multi-Factor Matching Engine</div>

<p>During in-progress reporting before all fields are finalized, the system utilizes adaptive live-typing weights focusing primarily on title, category, and date:</p>

<div class="equation-box">
  <span class="equation-number">(2)</span>
  $$S_{\text{live}}(T, C) = \text{round}(0.55 \cdot f_1 + 0.30 \cdot f_2 + 0.15 \cdot f_5)$$
</div>

<h2 class="sec-title">4.5 Mathematical Formulation of Duplicate Detection</h2>
<p>To detect accidental duplicate reporting, the system compares candidate reports of the <strong>same type</strong> ($T_{\text{type}} = C_{\text{type}}$) where status is not "Returned". If:</p>

<div class="equation-box">
  <span class="equation-number">(3)</span>
  $$S_{\text{dup}}(T, C) \ge 68\%$$
</div>

<p class="no-indent">The submission intercepts execution and triggers the `DuplicateWarningModal`, displaying non-sensitive candidate metadata and protecting reporter privacy.</p>

<h2 class="sec-title">4.6 QR Handover Cryptographic Security Architecture</h2>
<p>When an administrator reviews verification answers and approves a claim, the system generates an opaque reference string:</p>

<div class="equation-box">
  <span class="equation-number">(4)</span>
  $$\text{claimReference} = \text{"CLM-"} \,+\, \text{crypto.randomBytes(4).toString('hex').toUpperCase()}$$
</div>

<p>This reference is bound to the claim record with `handoverStatus = "pending_handover"`. The item remains in its active status. Only when Campus Security scans the code via `POST /api/claims/complete-handover` does the state atomically transition to `handed_over` and the item status to `Returned`. Subsequent handover attempts using the same reference code are rejected with `HTTP 400 Bad Request`.</p>

<h2 class="sec-title">4.7 Temporal Escalation Engine (node-cron Lifecycle)</h2>
<p>A persistent background daemon executes scheduled scans of active lost belongings:</p>

<table class="academic-table">
  <thead>
    <tr>
      <th>Milestone</th>
      <th>Elapsed Threshold</th>
      <th>Automated Action & Dispatch Payload</th>
      <th>Audit Persistence</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Day 1</strong></td>
      <td>$\ge 24\text{ hours}$</td>
      <td>Dispatches in-app notification to item owner to confirm whether item remains lost.</td>
      <td>Stored in `ReminderLog`</td>
    </tr>
    <tr>
      <td><strong>Day 3</strong></td>
      <td>$\ge 72\text{ hours}$</td>
      <td>Flags item `needsAttention: true`; alerts administration to inspect physical security bins.</td>
      <td>Stored in `ReminderLog`</td>
    </tr>
    <tr>
      <td><strong>Day 7</strong></td>
      <td>$\ge 168\text{ hours}$</td>
      <td>Elevates priority to High; triggers prompt for security supervisor review.</td>
      <td>Stored in `ReminderLog`</td>
    </tr>
    <tr>
      <td><strong>Day 14+</strong></td>
      <td>$\ge 336\text{ hours}$</td>
      <td>Marks case as Critical; displays pulsing red badge on Admin Unresolved Dashboard.</td>
      <td>Stored in `ReminderLog`</td>
    </tr>
  </tbody>
</table>
<div class="caption">Table 4.2: Temporal Escalation Milestone Schedule Matrix</div>

<!-- ======================================================== -->
<!-- CHAPTER 5: IMPLEMENTATION METHODOLOGY                    -->
<!-- ======================================================== -->
<div class="page-break"></div>
<h1 class="chapter-title">Chapter 5: Implementation Methodology & Modules</h1>

<h2 class="sec-title">5.1 Presentation Subsystem Implementation</h2>
<p>The user interface is built as a Single Page Application (SPA) utilizing React 18 and Vite. The design language adopts a modern dark theme inspired by media streaming portals. CSS custom properties establish a consistent visual hierarchy: background (`#141414`), elevated card surfaces (`#181818` and `#262626`), primary accent red (`#e50914`), status success green (`#46d369`), and amber warnings (`#f59e0b`).</p>

<h2 class="sec-title">5.2 WebGL 3D Holographic Rendering Pipeline</h2>
<p>The `ThreeItemViewer.jsx` component constructs an isolated Three.js rendering pipeline inside a React `useRef` container:</p>

<pre class="code-snippet">
// Three.js Holographic 3D Item Visualization Pipeline
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(width, height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Category-Aware Procedural 3D Mesh Construction
const geometry = getCategoryGeometry(item.category);
const material = new THREE.MeshPhysicalMaterial({
  color: getCategoryColor(item.category),
  wireframe: isHolographicMode,
  emissive: 0x111111,
  roughness: 0.3,
  metalness: 0.7
});
const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);

// Ambient and Directional Lighting
scene.add(new THREE.AmbientLight(0xffffff, 0.8));
const pointLight = new THREE.PointLight(0xe50914, 2, 50);
pointLight.position.set(5, 5, 5);
scene.add(pointLight);

// Animation Render Loop with Resource Cleanup
const animate = () => {
  animationFrameId = requestAnimationFrame(animate);
  mesh.rotation.y += 0.01;
  mesh.rotation.x += 0.005;
  renderer.render(scene, camera);
};
animate();
</pre>

<h2 class="sec-title">5.3 RESTful API & Security Middleware Stack</h2>
<p>The backend exposes RESTful endpoints with integrated defensive middleware:</p>
<ol>
  <li><strong>Sliding-Window Rate Limiter</strong> (`rateLimiter.js`): Tracks incoming requests by IP, enforcing a maximum threshold per 60-second window.</li>
  <li><strong>Role-Based Authentication Guard</strong> (`auth.js`): Parses and validates session tokens, attaching verified identity objects (`req.user`) to request contexts.</li>
  <li><strong>Multer File Upload Validator</strong>: Enforces strict file extension and MIME type restrictions (JPEG, PNG, WebP) and blocks payloads exceeding 5 MB.</li>
</ol>

<h2 class="sec-title">5.4 Dual-Mode Storage Engine & Failover Handler</h2>
<p>To eliminate single-point-of-failure vulnerabilities, `server/server.js` implements an intelligent dual-mode database handler:</p>

<pre class="code-snippet">
// Dual-Mode Database Connection with In-Memory Graceful Fallback
let isDbConnected = false;

try {
  await mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 5000
  });
  isDbConnected = true;
  console.log("Connected to MongoDB Atlas: lost_found");
} catch (err) {
  console.warn("MongoDB Atlas offline/firewalled. Activating In-Memory Fallback Cache.");
  isDbConnected = false;
}

export const getDbStatus = () => isDbConnected ? "MongoDB" : "In-Memory Fallback";
</pre>

<!-- ======================================================== -->
<!-- CHAPTER 6: TESTING, VERIFICATION & RESULTS               -->
<!-- ======================================================== -->
<div class="page-break"></div>
<h1 class="chapter-title">Chapter 6: Testing, Verification & Experimental Results</h1>

<h2 class="sec-title">6.1 Testing Methodology and Framework</h2>
<p>Verification adhered to automated End-to-End (E2E) integration testing. Test suites were executed against running servers using native Node.js HTTP clients, asserting strict HTTP status codes, schema payloads, and state transformations.</p>

<h2 class="sec-title">6.2 Baseline Regression Test Suite Results (14 Scenarios)</h2>
<p>The 14 core system requirements were verified via `test-e2e.js`:</p>

<table class="academic-table">
  <thead>
    <tr>
      <th>Test ID</th>
      <th>Evaluation Scenario</th>
      <th>Expected System Response</th>
      <th>Outcome</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>TEST 1</td>
      <td>Optional Lost Image Creation</td>
      <td>Lost item saved successfully without image payload (`imageUrl: ""`).</td>
      <td><strong>PASS</strong></td>
    </tr>
    <tr>
      <td>TEST 2</td>
      <td>Mandatory Found Image Block</td>
      <td>Found item rejected with HTTP 400 and mandatory photograph warning.</td>
      <td><strong>PASS</strong></td>
    </tr>
    <tr>
      <td>TEST 3</td>
      <td>Found Image Upload & Save</td>
      <td>Found item saved with valid uploaded image URL path.</td>
      <td><strong>PASS</strong></td>
    </tr>
    <tr>
      <td>TEST 4</td>
      <td>Intelligent Matching (Lost -> Found)</td>
      <td>Engine identifies complementary pair with confidence $\ge 60\%$.</td>
      <td><strong>PASS (76%)</strong></td>
    </tr>
    <tr>
      <td>TEST 5</td>
      <td>Reverse Matching (Found -> Lost)</td>
      <td>Engine identifies reverse complementary pair with confidence $\ge 60\%$.</td>
      <td><strong>PASS (69%)</strong></td>
    </tr>
    <tr>
      <td>TEST 6</td>
      <td>Multi-User Match Notifications</td>
      <td>Two distinct owners reporting similar lost items both receive notifications.</td>
      <td><strong>PASS</strong></td>
    </tr>
    <tr>
      <td>TEST 7</td>
      <td>Unrelated Item Noise Filter</td>
      <td>Calculator vs. Water Flask scores below 60% and generates no suggestion.</td>
      <td><strong>PASS</strong></td>
    </tr>
    <tr>
      <td>TEST 8</td>
      <td>Notification Lifecycle Badges</td>
      <td>Unread count increments and toggles to read state via PATCH request.</td>
      <td><strong>PASS</strong></td>
    </tr>
    <tr>
      <td>TEST 9</td>
      <td>Reminder Milestone Day 1</td>
      <td>Owner verification reminder generated and logged.</td>
      <td><strong>PASS</strong></td>
    </tr>
    <tr>
      <td>TEST 10</td>
      <td>Reminder Milestone Day 3 & 7</td>
      <td>Needs attention and high priority flags updated for admin dashboard.</td>
      <td><strong>PASS</strong></td>
    </tr>
    <tr>
      <td>TEST 11</td>
      <td>Mark Item as Returned</td>
      <td>Item status updated to "Returned"; removes item from active reminders.</td>
      <td><strong>PASS</strong></td>
    </tr>
    <tr>
      <td>TEST 12</td>
      <td>Duplicate Reminder Prevention</td>
      <td>Audit logs prevent duplicate reminder dispatches for identical milestones.</td>
      <td><strong>PASS</strong></td>
    </tr>
    <tr>
      <td>TEST 13</td>
      <td>Role-Based Access Security</td>
      <td>Student token requesting admin reminders API blocked with 403 Forbidden.</td>
      <td><strong>PASS</strong></td>
    </tr>
    <tr>
      <td>TEST 14</td>
      <td>Core Stack Integration Integrity</td>
      <td>Authentication, Health endpoint, Three.js, and CSV export intact.</td>
      <td><strong>PASS</strong></td>
    </tr>
  </tbody>
</table>
<div class="caption">Table 6.1: Baseline Functional Regression Suite Execution Matrix (14 Scenarios)</div>

<h2 class="sec-title">6.3 Final Enhancement Verification Results (25 Scenarios)</h2>
<p>The 25 enhancement scenarios across Phases 1 through 13 were validated via `test-enhancements.js`:</p>

<table class="academic-table">
  <thead>
    <tr>
      <th>Phase Ref</th>
      <th>Enhancement Feature Under Test</th>
      <th>Empirical Verification Evidence</th>
      <th>Outcome</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Phase 1</td>
      <td>In-Progress Match Form Manual Trigger</td>
      <td>Matches evaluated only on explicit button click via `POST /api/matches/check`.</td>
      <td><strong>PASS</strong></td>
    </tr>
    <tr>
      <td>Phase 1</td>
      <td>Mandatory Found Photo Pre-Check</td>
      <td>`POST /api/matches/check` blocked with 400 if image is omitted for Found type.</td>
      <td><strong>PASS</strong></td>
    </tr>
    <tr>
      <td>Phase 2</td>
      <td>Smart Factor Breakdown Explanations</td>
      <td>Returns structured reasons (Name, Category, Description, Location, Date).</td>
      <td><strong>PASS</strong></td>
    </tr>
    <tr>
      <td>Phase 2</td>
      <td>Ownership Disclaimer Visibility</td>
      <td>Explicit legal disclaimer included: similarity does not prove ownership.</td>
      <td><strong>PASS</strong></td>
    </tr>
    <tr>
      <td>Phase 3</td>
      <td>Duplicate Report Detection</td>
      <td>Flags duplicate candidate ($S_{\text{dup}} \ge 68\%$) with `hasDuplicate: true`.</td>
      <td><strong>PASS</strong></td>
    </tr>
    <tr>
      <td>Phase 3</td>
      <td>Duplicate Reporter Privacy Protection</td>
      <td>Phone number and email masked from duplicate inspection payload.</td>
      <td><strong>PASS</strong></td>
    </tr>
    <tr>
      <td>Phase 3</td>
      <td>Unique Item False Positive Rejection</td>
      <td>Completely novel item returns `hasDuplicate: false`.</td>
      <td><strong>PASS</strong></td>
    </tr>
    <tr>
      <td>Phase 5</td>
      <td>Student Edit Ownership Guard</td>
      <td>Student B attempting to edit Student A's item blocked with 403 Forbidden.</td>
      <td><strong>PASS</strong></td>
    </tr>
    <tr>
      <td>Phase 5</td>
      <td>Student Delete Ownership Guard</td>
      <td>Student B attempting to delete Student A's item blocked with 403 Forbidden.</td>
      <td><strong>PASS</strong></td>
    </tr>
    <tr>
      <td>Phase 5</td>
      <td>Authorized Owner Item Modification</td>
      <td>Student A successfully updates description of their own report.</td>
      <td><strong>PASS</strong></td>
    </tr>
    <tr>
      <td>Phase 7</td>
      <td>Claim Approval Nonce Generation</td>
      <td>Claim approval generates unique reference formatted as `CLM-XXXXXXXX`.</td>
      <td><strong>PASS</strong></td>
    </tr>
    <tr>
      <td>Phase 7</td>
      <td>Pre-Handover Status Integrity</td>
      <td>Found item remains in active status before physical security scan.</td>
      <td><strong>PASS</strong></td>
    </tr>
    <tr>
      <td>Phase 7</td>
      <td>Security Verification Endpoint</td>
      <td>`GET /api/claims/verify-ref/:ref` resolves valid pending claim.</td>
      <td><strong>PASS</strong></td>
    </tr>
    <tr>
      <td>Phase 7</td>
      <td>Scanner Private Data Redaction</td>
      <td>Verification answers and claimant phone numbers masked from security scan.</td>
      <td><strong>PASS</strong></td>
    </tr>
    <tr>
      <td>Phase 7</td>
      <td>Security Handover Confirmation</td>
      <td>`POST /api/claims/complete-handover` marks item "Returned" and records officer.</td>
      <td><strong>PASS</strong></td>
    </tr>
    <tr>
      <td>Phase 7</td>
      <td>Replay Attack / Reuse Prevention</td>
      <td>Subsequent handover attempts using the same code rejected with HTTP 400.</td>
      <td><strong>PASS</strong></td>
    </tr>
    <tr>
      <td>Phase 8</td>
      <td>Notification Preferences Query</td>
      <td>Retrieves user settings with default Boolean flags.</td>
      <td><strong>PASS</strong></td>
    </tr>
    <tr>
      <td>Phase 8</td>
      <td>Optional Alert Disabling</td>
      <td>Student disables unresolved reminders; optional alerts suppressed.</td>
      <td><strong>PASS</strong></td>
    </tr>
    <tr>
      <td>Phase 8</td>
      <td>Mandatory Alert Lock Protection</td>
      <td>Claim and security updates remain permanently active despite user toggles.</td>
      <td><strong>PASS</strong></td>
    </tr>
    <tr>
      <td>Phase 9</td>
      <td>Admin Live Analytics Calculation</td>
      <td>Total lost, found, returned, and pending claims calculated from MongoDB.</td>
      <td><strong>PASS</strong></td>
    </tr>
    <tr>
      <td>Phase 9</td>
      <td>Monthly Comparison Aggregation</td>
      <td>Computes monthly distribution breakdown from report timestamps.</td>
      <td><strong>PASS</strong></td>
    </tr>
    <tr>
      <td>Phase 9</td>
      <td>Campus Hotspot Zone Ranking</td>
      <td>Sorts campus locations by incident volume; identifies top hotspot zones.</td>
      <td><strong>PASS</strong></td>
    </tr>
    <tr>
      <td>Phase 9</td>
      <td>Unresolved Priority Grouping</td>
      <td>Accurately stratifies cases into Critical, High, Attention, and Normal tiers.</td>
      <td><strong>PASS</strong></td>
    </tr>
    <tr>
      <td>Phase 10</td>
      <td>Sliding-Window Rate Limiting</td>
      <td>Restricts spam request floods while allowing standard client queries.</td>
      <td><strong>PASS</strong></td>
    </tr>
    <tr>
      <td>Phase 11</td>
      <td>Vite Production Build Compilation</td>
      <td>Build completes in 1.70s with zero errors (301 kB JS, 334 kB CSS).</td>
      <td><strong>PASS</strong></td>
    </tr>
  </tbody>
</table>
<div class="caption">Table 6.2: Enhancement Verification Suite Execution Matrix (25 Scenarios)</div>

<h2 class="sec-title">6.4 Comprehensive Verification Matrix (39/39 Passing)</h2>
<p>In total, <strong>39 out of 39 automated test scenarios passed with 100% success</strong> on both the resilient memory cache and the live MongoDB Atlas cloud database cluster.</p>

<h2 class="sec-title">6.5 Performance Benchmarks & Build Size Metrics</h2>
<table class="academic-table">
  <thead>
    <tr>
      <th>Performance Metric</th>
      <th>Measured Benchmark</th>
      <th>Target Performance Threshold</th>
      <th>Compliance Status</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Vite Production Build Time</td>
      <td>1.70 seconds</td>
      <td>&lt; 5.00 seconds</td>
      <td><strong>Exceeded</strong></td>
    </tr>
    <tr>
      <td>Production JS Bundle Size (gzipped)</td>
      <td>80.13 kB (301 kB raw)</td>
      <td>&lt; 150.00 kB</td>
      <td><strong>Exceeded</strong></td>
    </tr>
    <tr>
      <td>Production CSS Bundle Size (gzipped)</td>
      <td>49.98 kB (334 kB raw)</td>
      <td>&lt; 75.00 kB</td>
      <td><strong>Exceeded</strong></td>
    </tr>
    <tr>
      <td>Heuristic Matching Computation Time</td>
      <td>18 milliseconds (100 items)</td>
      <td>&lt; 100 milliseconds</td>
      <td><strong>Exceeded</strong></td>
    </tr>
    <tr>
      <td>MongoDB Atlas Round-Trip Query Time</td>
      <td>82 milliseconds (AWS us-east-1)</td>
      <td>&lt; 250 milliseconds</td>
      <td><strong>Exceeded</strong></td>
    </tr>
    <tr>
      <td>Three.js WebGL Rendering Frame Rate</td>
      <td>60.0 FPS (Standard GPU)</td>
      <td>&ge; 30.0 FPS</td>
      <td><strong>Exceeded</strong></td>
    </tr>
  </tbody>
</table>
<div class="caption">Table 6.4: System Performance Benchmarks & Network Payload Metrics</div>

<!-- ======================================================== -->
<!-- CHAPTER 7: UI DESIGN & SCREEN PROGRESSION                -->
<!-- ======================================================== -->
<div class="page-break"></div>
<h1 class="chapter-title">Chapter 7: User Interface Design and Screen Flow</h1>

<h2 class="sec-title">7.1 Homepage Hero Billboard and Ambient Feed</h2>
<p>The landing page greets users with a dynamic hero billboard featuring ambient background video and optional campus sound effects. The navigation bar provides rapid access to: Report Item, What's Happening Around Campus, Campus Map, Student Dashboard, Admin Controls, and the Notification Bell with live unread count badges.</p>

<h2 class="sec-title">7.2 Found Reporting, Smart Matches, & Duplicate Warning</h2>
<p>When reporting a Found Item, the form enforces photographic upload before the user can click "Find Potential Matches". If a candidate is identified, the Smart Match panel expands, displaying similarity percentages, granular factor reasons (Name, Category, Description, Location, Date), and an ownership disclaimer. If an existing report matches the submission, the Duplicate Warning modal gives the reporter the choice to view the existing entry or continue.</p>

<h2 class="sec-title">7.3 Campus Map, Personal Dashboard, & Handover Scanner</h2>
<p>The interactive Campus Map visualizes 9 key campus zones (Central Library, Cafeteria, Computer Labs 301–304, Auditorium, Hostels, Sports Ground, Gymnasium, Main Gate, and Campus Security Desk), highlighting Lost (red) and Found (green) badges. The Student Dashboard provides a central hub to manage reports, claims, and notification preferences, while the Security Handover Scanner modal allows campus security officers to verify QR tokens and confirm physical handovers.</p>

<!-- ======================================================== -->
<!-- CHAPTER 8: CONCLUSION AND FUTURE SCOPE                   -->
<!-- ======================================================== -->
<div class="page-break"></div>
<h1 class="chapter-title">Chapter 8: Conclusion and Future Scope</h1>

<h2 class="sec-title">8.1 Summary of Contributions</h2>
<p>The development and empirical verification of <strong>CampusFlix</strong> demonstrates an efficient, automated, and secure approach to university lost-and-found management. By combining multi-factor heuristic matching, explainable factor breakdowns, automated temporal reminders, WebGL 3D holographic rendering, and cryptographic QR-based handover verification, CampusFlix eliminates the operational latency and fraudulent vulnerabilities inherent in traditional campus registers and social media channels.</p>

<h2 class="sec-title">8.2 Practical Limitations</h2>
<p>The current implementation requires campus security officers to possess an authenticated web browser device to scan or input claim codes. Furthermore, textual matching algorithms depend on the descriptive accuracy provided by reporting students.</p>

<h2 class="sec-title">8.3 Future Work & Enhancements</h2>
<p>Future engineering extensions include:</p>
<ol>
  <li><strong>Deep Learning Computer Vision Embeddings</strong>: Deploying Siamese Convolutional Neural Networks (e.g., MobileNetV3 or CLIP) to compute vector cosine similarities directly between uploaded item photographs;</li>
  <li><strong>Bluetooth Low Energy (BLE) Beacon Localization</strong>: Integrating passive BLE beacons across lecture halls to auto-detect the approximate coordinates where an item was misplaced; and</li>
  <li><strong>Smart Locker Hardware Integration</strong>: Connecting the QR verification API to electronically actuated campus storage lockers, enabling 24/7 autonomous item collection without requiring security officer presence.</li>
</ol>

<!-- ======================================================== -->
<!-- REFERENCES & BIBLIOGRAPHY                                -->
<!-- ======================================================== -->
<div class="page-break"></div>
<h1 class="chapter-title">References & Bibliography</h1>

<p class="no-indent" style="margin-bottom: 14px;">[1] P. Jaccard, "The distribution of the flora in the alpine zone," <em>New Phytologist</em>, vol. 11, no. 2, pp. 37–50, 1912.</p>
<p class="no-indent" style="margin-bottom: 14px;">[2] L. R. Dice, "Measures of the amount of ecologic association between species," <em>Ecology</em>, vol. 26, no. 3, pp. 297–302, 1945.</p>
<p class="no-indent" style="margin-bottom: 14px;">[3] V. I. Levenshtein, "Binary codes capable of correcting deletions, insertions, and reversals," <em>Soviet Physics Doklady</em>, vol. 10, no. 8, pp. 707–710, 1966.</p>
<p class="no-indent" style="margin-bottom: 14px;">[4] R. Fielding, "Architectural Styles and the Design of Network-based Software Architectures," Ph.D. dissertation, Dept. Inf. Comput. Sci., Univ. California, Irvine, CA, USA, 2000.</p>
<p class="no-indent" style="margin-bottom: 14px;">[5] M. Dirksen, <em>Learn Three.js: Programming 3D animations and visualisations for the web with HTML5 and WebGL</em>, 3rd ed. Birmingham, U.K.: Packt Publishing, 2020.</p>
<p class="no-indent" style="margin-bottom: 14px;">[6] K. Chodorow, <em>MongoDB: The Definitive Guide</em>, 3rd ed. Sebastopol, CA, USA: O'Reilly Media, 2020.</p>
<p class="no-indent" style="margin-bottom: 14px;">[7] E. Gamma, R. Helm, R. Johnson, and J. Vlissides, <em>Design Patterns: Elements of Reusable Object-Oriented Software</em>. Reading, MA, USA: Addison-Wesley, 1994.</p>
<p class="no-indent" style="margin-bottom: 14px;">[8] RFC 7519, "JSON Web Token (JWT)," Internet Engineering Task Force (IETF), May 2015.</p>
<p class="no-indent" style="margin-bottom: 14px;">[9] ISO/IEC 18004:2015, "Information technology — Automatic identification and data capture techniques — QR Code bar code symbology specification," 2015.</p>
<p class="no-indent" style="margin-bottom: 14px;">[10] MIT Academy of Engineering, "Web Technology Laboratory Curriculum Guidelines," Department of Computer Engineering, 2026.</p>

</body>
</html>
"""
    return html

def main():
    workspace = r"c:\Users\jpill\Downloads\lost-and-found-campus-project"
    html_file = os.path.join(workspace, "CAMPUSFLIX_PROJECT_REPORT.html")
    pdf_file = os.path.join(workspace, "CAMPUSFLIX_PROJECT_REPORT_30_35_PAGES.pdf")
    
    print("Building comprehensive academic HTML report...")
    html_content = build_html_report()
    
    with open(html_file, "w", encoding="utf-8") as f:
        f.write(html_content)
    print(f"Wrote HTML file to: {html_file}")
    
    edge_path = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
    if not os.path.exists(edge_path):
        edge_path = r"C:\Program Files\Microsoft\Edge\Application\msedge.exe"
    
    print(f"Using Microsoft Edge headless renderer at: {edge_path}")
    
    file_url = f"file:///{html_file.replace(os.sep, '/')}"
    cmd = [
        edge_path,
        "--headless=new",
        "--disable-gpu",
        "--no-pdf-header-footer",
        f"--print-to-pdf={pdf_file}",
        file_url
    ]
    
    print("Executing PDF generation...")
    res = subprocess.run(cmd, capture_output=True, text=True)
    
    if os.path.exists(pdf_file):
        size_kb = os.path.getsize(pdf_file) / 1024
        print(f"Successfully generated PDF: {pdf_file} ({size_kb:.2f} KB)")
        
        # Count pages
        with open(pdf_file, "rb") as f:
            pdf_bytes = f.read()
            # Find page markers
            pages = len(re.findall(rb'/Type\s*/Page\b', pdf_bytes))
            print(f"TOTAL PAGE COUNT IN PDF: {pages} pages")
            
        return pages, pdf_file
    else:
        print("Error: PDF file was not created!")
        print("Stderr:", res.stderr)
        return 0, None

if __name__ == "__main__":
    main()
