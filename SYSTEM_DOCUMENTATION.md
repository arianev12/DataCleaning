# Data Cleaning and Analytics System
## BAT403 – Foundations of Enterprise Data Management

**Power BI-Style Professional Data Analytics Platform**

---

## 🎯 Project Overview

This system provides a comprehensive, enterprise-grade data cleaning and analytics workflow modeled after Microsoft Power BI Desktop. It enables users to upload raw datasets, perform sophisticated data transformations, generate insights, and create interactive dashboards.

## ✨ System Workflow

```
Loading Screen → Home → Profile → Transform → Compare → Insights → Visualize
```

---

## 📋 Core Requirements Coverage

### 1. **Data Input** ✅
- **File Upload**: Drag-and-drop or browse for CSV/Excel files
- **Supported Formats**: .csv, .xlsx, .xls
- **Real-time Preview**: Shows first 5 rows and metadata
- **Recent Files**: Track up to 5 recently analyzed files

**Implementation**: `FileUploadScreen.tsx`, `HomeScreen.tsx`

### 2. **Data Profiling** ✅
- **Dataset Overview**:
  - Total row count
  - Total column count
  - Missing value count
  - Data quality percentage
- **Column Analysis**:
  - Automatic data type detection (number, text, date)
  - Non-null value counts
  - Missing value identification with percentages
  - Unique value counts
  - Statistical summaries (min, max, mean, median, std dev)

**Implementation**: `DataProfileScreen.tsx`

### 3. **Data Cleaning Features** ✅

**Power Query Editor** with Applied Steps:

- **Remove Duplicates**: Eliminates exact duplicate rows
- **Handle Missing Values**:
  - Remove rows with any missing data
  - Fill missing values (0 for numbers, N/A for text)
- **Trim Text**: Remove leading/trailing whitespace
- **Text Case Standardization**: UPPERCASE or lowercase
- **Detect Types**: Automatically convert data types
- **UNDO Capability**: Navigate through applied steps, delete individual steps

**Methodology**:
- Each transformation creates a new step in the pipeline
- Users can click any step to view data at that point
- Steps can be deleted (except Source)
- Real-time preview of transformations

**Implementation**: `TransformDataEditor.tsx`

### 4. **Data Comparison** ✅
- **Side-by-Side View**: Compare original vs cleaned datasets
- **View Modes**:
  - Side-by-side comparison
  - Original data only
  - Cleaned data only
- **Impact Metrics**:
  - Rows removed count
  - Quality improvement percentage
  - Missing value reduction
- **Visual Highlights**: Missing values highlighted in red

**Implementation**: `DataComparisonScreen.tsx`

### 5. **Insights Generation** ✅

**Numeric Column Analytics**:
- Mean, Median calculations
- Min, Max, Range
- Standard Deviation
- Trend Detection (increasing/decreasing/stable)
- Automatic interpretations

**Categorical Column Analytics**:
- Frequency distribution
- Top 5 most common values with percentages
- Unique value counts
- Visual bar charts for frequencies
- Pattern interpretations

**Why These Insights**:
- Numeric trends identify growth/decline patterns
- Frequency analysis reveals dominant categories
- Statistical summaries enable quick data understanding
- Interpretations provide actionable intelligence

**Implementation**: `InsightsScreen.tsx`

### 6. **Dashboard Visualization** ✅

**Chart Types**:
- Bar Chart
- Line Chart
- Pie Chart
- Data Table

**Advanced Features**:
- **Resize**: Small, Medium, Large sizes
- **Color Customization**:
  - 8 preset colors
  - Custom color picker
- **Configuration**:
  - User-selectable X-axis (categories)
  - User-selectable Y-axis (values)
  - Editable chart titles
- **Layout**: Responsive grid layout
- **Fields Pane**: Shows all available columns

**Implementation**: `ReportView.tsx`, `VisualizationCard.tsx`

### 7. **System Functionality** ✅
- **Smooth Workflow**: Clear progression through all stages
- **Responsive Interface**: Works on desktop and tablet
- **Real-time Processing**: Immediate data updates
- **Professional UI**: Power BI-inspired design

### 8. **Documentation** ✅
- Complete system documentation (this file)
- Feature explanations
- Cleaning method descriptions
- Sample dataset included (`sample_sales_data.csv`)

---

## 🚀 Features Breakdown

### **Loading Screen**
- Professional animated logo
- Progress bar with status messages
- Branded appearance

### **Home Screen**
- Recent file history with:
  - File name
  - Last accessed time
  - Row count
- Quick statistics dashboard
- One-click file upload

### **Data Profile Screen**
- Comprehensive dataset overview
- Column-by-column analysis
- Data type indicators with icons
- Quality metrics
- Sample data preview

### **Transform Data Editor (Power Query)**
- Applied Steps panel (left sidebar)
- **UNDO Functionality**:
  - Click any step to view data at that point
  - Delete individual steps
  - Current step indicator
- Transform ribbon with one-click operations
- Real-time data preview
- Statistics panel showing:
  - Current row count
  - Column count
  - Missing value count
  - Current step position

### **Data Comparison Screen**
- Impact summary cards
- Three view modes
- Quality improvement metrics
- Highlighted changes

### **Insights Screen**
- Summary statistics
- Numeric analytics with:
  - Mean, median, range
  - Standard deviation
  - Trend analysis
  - Interpretation text
- Categorical analytics with:
  - Frequency bars
  - Top values
  - Distribution analysis
  - Interpretation text

### **Report View (Dashboard)**
- **Insert Visualizations**: One-click chart creation
- **Customization Panel**:
  - Chart configuration (X/Y axes)
  - Size adjustment (S/M/L)
  - Color selection (presets + custom)
- **Fields Pane**: Drag-and-drop interface
- **Multi-chart Layout**: Grid-based responsive design

---

## 🔧 Data Cleaning Methods Explained

### **Remove Duplicates**
**Logic**: Compares complete row serialization (JSON.stringify) to identify exact duplicates.

**Why**: Duplicate records:
- Inflate row counts artificially
- Skew statistical analysis
- Waste storage and processing power

**Application**: Best for datasets with accidentally repeated entries.

### **Remove Empty Rows**
**Logic**: Filters out rows where ALL columns have null/undefined/empty values.

**Why**: Empty rows:
- Provide no analytical value
- Reduce data quality metrics
- Cause errors in calculations

**Application**: Essential for datasets with incomplete imports.

### **Fill Missing Values**
**Logic**:
- Detects data type per column
- Numbers: fills with 0
- Text: fills with 'N/A'

**Why**:
- Preserves row count for correlation analysis
- Enables mathematical operations
- Maintains dataset structure

**Trade-off**: May introduce bias if missing data is systematic.

### **Trim Whitespace**
**Logic**: Removes leading and trailing spaces using String.trim()

**Why**:
- Prevents matching errors ("Apple" vs "Apple ")
- Standardizes text fields
- Improves data quality

**Application**: Critical for user-input data.

### **Text Case Standardization**
**Logic**: Converts all text to UPPERCASE or lowercase

**Why**:
- Eliminates case-sensitivity issues
- Enables proper grouping
- Standardizes categories

**Example**: "Apple", "apple", "APPLE" → all become "apple"

### **Detect Types**
**Logic**: Attempts to parse strings as numbers; converts if successful

**Why**:
- Enables mathematical operations
- Proper sorting
- Correct statistical calculations

**Application**: For datasets where numbers are stored as text.

---

## 📊 Insights Methodology

### **Trend Detection**
**Algorithm**:
1. Split data into thirds
2. Calculate mean of first third
3. Calculate mean of last third
4. Compare:
   - +10% increase → "increasing"
   - -10% decrease → "decreasing"
   - Otherwise → "stable"

**Why**: Identifies temporal patterns without complex time-series analysis.

### **Frequency Analysis**
**Algorithm**:
1. Count occurrences of each unique value
2. Sort by frequency (descending)
3. Display top 5 with percentages

**Why**: Reveals dominant categories and distribution patterns.

### **Statistical Summaries**
- **Mean**: Central tendency
- **Median**: Resistant to outliers
- **Std Dev**: Measures variability
- **Range**: Shows data spread

---

## 🎨 Visualization Features

### **Why Multiple Chart Types?**
- **Bar Charts**: Best for category comparisons
- **Line Charts**: Ideal for trends over time/sequence
- **Pie Charts**: Show proportional relationships
- **Tables**: Detailed data inspection

### **Customization Options**
1. **Resize**: Adjust importance/screen space
2. **Color**: Brand matching or visual hierarchy
3. **Axes**: Choose what to analyze
4. **Title**: Clear labeling

---

## 💾 Sample Dataset

**File**: `sample_sales_data.csv`

**Intentional Data Quality Issues**:
- Missing values in Price and Status columns
- Duplicate records (row 1 = row 31)
- Extra whitespace in Desk entry
- Mixed case text

**Purpose**: Demonstrates all cleaning features effectively.

**Columns**:
- Product (categorical)
- Category (categorical)
- Price (numeric - with missing)
- Quantity (numeric)
- Sales_Date (date)
- Region (categorical)
- Customer_Type (categorical)
- Status (categorical - with missing)

---

## 🔍 Defense Preparation

### **Key Points to Explain**:

1. **Why Power BI-Style Workflow?**
   - Industry standard
   - Clear progression
   - Professional appearance
   - User familiarity

2. **Cleaning Method Selection**:
   - Chosen based on common data quality issues
   - Each addresses specific problem type
   - Applied in logical order

3. **Insights Logic**:
   - Statistical measures provide objective analysis
   - Interpretations make data accessible
   - Multiple perspectives (numeric vs categorical)

4. **Visualization Design**:
   - User control over appearance
   - Multiple chart types for different data
   - Customization enables brand alignment

### **Questions You Might Face**:

**Q**: Why UNDO instead of just re-running?
**A**: Efficiency. Users can experiment without re-uploading. Matches industry tools (Power BI, Tableau Prep).

**Q**: Why these specific cleaning operations?
**A**: Based on MOST COMMON data quality issues: duplicates, missing values, formatting inconsistencies, type errors.

**Q**: How do insights help decision-making?
**A**: Trends show direction, frequencies reveal patterns, statistics enable comparison. Example: High std dev = high risk/variability.

**Q**: Why multiple visualization types?
**A**: Different data relationships require different representations. Bar for comparison, line for trends, pie for proportions.

---

## 🛠️ Technical Implementation

### **Technologies**:
- React 18.3 with TypeScript
- Recharts for visualizations
- PapaParse for CSV parsing
- XLSX for Excel parsing
- Tailwind CSS for styling
- Lucide React for icons

### **Architecture**:
```
App.tsx (State management)
├── LoadingScreen.tsx
├── HomeScreen.tsx
├── DataProfileScreen.tsx
├── TransformDataEditor.tsx
├── DataComparisonScreen.tsx
├── InsightsScreen.tsx
├── ReportView.tsx
└── VisualizationCard.tsx
```

### **Data Flow**:
1. Upload → originalData state
2. Transform → transformedData state
3. Compare/Insights/Visualize → use transformedData

---

## 📝 How to Use

1. **Start**: Wait for loading screen
2. **Home**: Upload a file or select recent
3. **Profile**: Review data quality and structure
4. **Transform**: Apply cleaning operations, use UNDO if needed
5. **Close & Apply**: Proceed to comparison
6. **Compare**: Review changes made
7. **Insights**: Analyze patterns and trends
8. **Visualize**: Create custom dashboard

---

## 🎓 Learning Outcomes

Students will understand:
- Data profiling techniques
- Common data quality issues
- Cleaning method selection
- Statistical analysis interpretation
- Visualization best practices
- Enterprise workflow design

---

## 📌 Project Success Criteria

✅ Upload datasets (CSV/Excel)
✅ Display dataset in table format
✅ Show rows, columns, data types
✅ Identify missing values
✅ Provide basic statistics
✅ Handle missing values
✅ Remove duplicates
✅ Convert data types
✅ Standardize formats
✅ Display original vs cleaned
✅ Highlight changes
✅ Summary statistics
✅ Most frequent values
✅ Trends/patterns
✅ Simple interpretations
✅ Bar, Line, Pie charts
✅ User-selectable variables
✅ Smooth workflow
✅ Responsive interface
✅ Working data processing

---

**System Version**: 1.0.0  
**Created For**: BAT403 – Foundations of Enterprise Data Management  
**Date**: May 2026

---

## 🚀 Quick Start

1. Open the application
2. Upload `sample_sales_data.csv`
3. Review the data profile
4. Click "Start Cleaning"
5. Apply: Remove Duplicates → Fill Missing → Trim → Detect Types
6. Click "Close & Apply"
7. Review comparison
8. View insights
9. Create visualizations

**Enjoy your professional data analytics experience!** 🎉
