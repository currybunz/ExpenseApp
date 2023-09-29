import React, { createContext, useReducer, useContext, useState } from 'react';
import { View, Text, Button, TextInput, FlatList, TouchableOpacity } from 'react-native';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import DatePicker from 'react-datepicker'; // Import DatePicker from react-datepicker
import 'react-datepicker/dist/react-datepicker.css'; // Import CSS styles for DatePicker
import { createStackNavigator } from '@react-navigation/stack';
import { v4 as uuidv4 } from 'uuid';
import {TiDelete} from 'react-icons/ti';
import { PieChart } from 'react-native-chart-kit';
import logo from './assets/Moneykinekologo1.png';


const AppContext = createContext();
const Stack = createStackNavigator();

//Define array for the selection of category
const categories = ['Food', 'Transport', 'Health & Personal Care', 'Travel', 'Leisure', 'Clothing']

const AppProvider = (props) => {
  const [state, dispatch] = useReducer(AppReducer, initialState);

  return (
    <AppContext.Provider value={{ expenses: state.expenses, budget: state.budget, dispatch }}>
      {props.children}
    </AppContext.Provider>
  );
};

//function to respond to user action and relay it to useReducer
const AppReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_EXPENSE':
      return {
        ...state,
        expenses: [...state.expenses, action.payload],
      };
    case 'DELETE_EXPENSE':
      return {
        ...state,
        expenses: state.expenses.filter((expense) => expense.id !== action.payload),
      };
      case 'SET_BUDGET':
      return {
        ...state,
        budget: action.payload,
      };

    default:
      return state;
  }
};


//Main screen that user will first see when they load the app
const HomeScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <img src= {logo} style={styles.logo}/>
      <Text style={styles.header}>Budget Planner</Text>
      <Budget />
      <Remains />
      <ExpenseTotal />
      <View style={styles.expenseHeader}>
      <Text style={styles.header}>Expenses</Text>
      <TouchableOpacity style={styles.overviewButton} onPress={() => navigation.navigate('Overview')}>
        <Text style={styles.buttonText}>Overview</Text>
      </TouchableOpacity>
      </View>
      <ExpenseList />
      <TouchableOpacity style={styles.submitButton} onPress={() => navigation.navigate('AddTransaction')}>
        <Text style={styles.buttonText}>Add Transaction</Text>
      </TouchableOpacity>

    </View>
  );
};


const AddTransactionScreen = () => {
  const { dispatch } = useContext(AppContext);
  const navigation = useNavigation('');


  const [selectedCategory, setSelectedCategory] = useState('Food');
  const [cost, setCost] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());

  const [errors, setErrors] =useState({
    category:'',
    cost: '',
    date: '',
  })

  
  const onSubmit = () => {

    //Validate form to check for missing inputs
    let hasErrors =false;
    const newErrors ={
      category:'',
      cost: '',
      date: '',
    };

    if (!categories) {
      newErrors.category = 'Category cannot be left empty';
      hasErrors = true;
    }

    if (!cost || isNaN(cost)) {
      newErrors.cost = 'Cost cannot be left empty';
      hasErrors = true;
    }

    if (!selectedDate) {
      newErrors.date = 'Date cannot be left empty';
      hasErrors = true;
    }

    if(hasErrors){
      setErrors(newErrors);
    }

    else{

    const expense = {
      id: uuidv4(),
      category: selectedCategory,
      cost: parseInt(cost),
      date: selectedDate, 
    };

    dispatch({
      type: 'ADD_EXPENSE',
      payload: expense,
    });

    setCost('');
    setSelectedDate(new Date());
    
    //navigate back to home screen after form submit
    navigation.navigate('HomeScreen')
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Add Expenses</Text>
      <Text style={styles.formLabel}>Category:</Text>
      <select
        value={selectedCategory}
        onChange={(e) => setSelectedCategory(e.target.value)}
        style={styles.input}
      >
        {categories.map((category) => (
          <option key={category} value={category}>
            {category}
          </option>
        ))}
      </select>

      {/* Set the error message for invalid input */}
      {errors.category ? <Text style={styles.errorText}>{errors.category}</Text> : null}

      <Text style={styles.formLabel}>Cost:</Text>
      <input
        type="number"
        placeholder="Enter Cost"
        value={cost}
        onChange={(e) => setCost(e.target.value)}
        style={styles.input}
      />

      {/* Set the error message for invalid input */}
      {errors.cost ? <Text style={styles.errorText}>{errors.cost}</Text> : null}
       <Text style={styles.formLabel}>Date:</Text>
       
       {/* show date picker */}
      <DatePicker
        selected={selectedDate}
        onChange={(date) => setSelectedDate(date)}
        dateFormat="MM/dd/yyyy"
        className="date-picker"
      />

      <TouchableOpacity style={styles.submitButton} onPress={onSubmit}>
        <Text style={styles.buttonText}>Save transaction</Text>
      </TouchableOpacity>
    </View>
  );
};

const OverviewScreen = () => {
  const { expenses } = useContext(AppContext);

  // Calculate spending by category
  const categoryData = expenses.reduce((categoryMap, expense) => {
    const { category, cost } = expense;
    if (categoryMap[category]) {
      categoryMap[category] += cost;
    } else {
      categoryMap[category] = cost;
    }
    return categoryMap;
  }, {});

  // Data to display in a pie chart
  const pieChartData = Object.keys(categoryData).map((category) => ({
    name: category,
    cost: categoryData[category],
    // Use random function to generate a random color
    color: `#${Math.floor(Math.random() * 16777215).toString(16)}`, 
    legendFontColor: '#7F7F7F',
    legendFontSize: 15,
  }));

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Spending Overview</Text>
      <PieChart
        data={pieChartData}
        width={350}
        height={200}
        chartConfig={{
          backgroundGradientFrom: '#1E2923',
          backgroundGradientTo: '#08130D',
          color: (opacity = 1) => `rgba(26, 255, 146, ${opacity})`,
        }}
        accessor="cost"
        backgroundColor="transparent"
        paddingLeft="15"
        absolute
      />
    </View>
  );
};

const EditBudgetScreen = () => {
  const { budget, dispatch } = useContext(AppContext);
  const [newBudget, setNewBudget] = useState(budget.toString()); // Convert budget to a string
  const navigation =useNavigation('')
  const [error, setError] = useState('');

  const onSaveBudget = () => {
    // Remove any whitespace
    const trimmedBudget = newBudget.trim();

    // Check if the input consists other characters other than numbers
    if (/^\d+$/.test(trimmedBudget)) {
      const parsedBudget = parseFloat(trimmedBudget);
      dispatch({
        type: 'SET_BUDGET',
        payload: parsedBudget,
      });
      //navigate back to home screen after form submit
    navigation.navigate('HomeScreen')
    } else {
      // Set the error message for invalid input
      setError('Invalid budget amount. Please enter a valid number.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Edit Budget</Text>
      <Text style={styles.formLabel}>New Budget Amount:</Text>
      <TextInput
        placeholder="New Budget"
        value={newBudget}
        onChangeText={(text) => {
          setNewBudget(text); 
          clearError();}}
        
        keyboardType="numeric"
        style={styles.input}
      />
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity style={styles.submitButton} onPress={onSaveBudget}>
        <Text style={styles.buttonText}>Save Budget</Text>
      </TouchableOpacity>
    </View>
  );
};


//hard coded data to show interface when app is first loaded
const initialState = {
  budget: 2000,
  expenses: [
    { id: uuidv4(), category: 'Food', cost: 20 },
    { id: uuidv4(), category: 'Leisure', cost: 300 },
    { id: uuidv4(), category: 'Transport', cost: 5.3 },
  ],
};


//styles for the whole app
const styles = {
  container: {
    flex: 1,
    padding: 20,
    backgroundColor:"#FFF2EB",
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color:"#171A1F",
  },
  logo: {
    width: "40%",
    height: 'auto',
    marginBottom: 20,
    marginLeft:'30%',
    alignItems: 'center',
  },
  budgetContainer: {
    backgroundColor: '#3498db',
    padding: 15,
    borderRadius: 5,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  budgetText: {
    color: 'white',
    fontSize: 20,

  },
  remainsContainer: {
    backgroundColor: '#8CC7AB',
    padding: 15,
    borderRadius: 5,
    marginBottom: 10,
  },
  remainsText: {
    color: 'white',
    fontSize: 20,
  },
  expenseTotalContainer: {
    backgroundColor: '#3D4750',
    padding: 15,
    borderRadius: 5,
    marginBottom: 20,
  },
  expenseTotalText: {
    color: 'white',
    fontSize: 20,
  },
  expenseItem: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#ecf0f1',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  expenseCategory: {
    fontSize: 18,
  },
  expenseCost: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  addExpenseForm: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 20,
    borderRadius: 5,
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: '#107AA8',
    maxwidth:1500,
    padding: 15,
    borderRadius: 5,
    margin:25,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    fontSize: 14,
    marginBottom: 10,
  },

  overviewButton:{
    backgroundColor: '#107AA8',
    padding: 15,
    borderRadius: 5,
    width:"50%",
    marginLeft:"25%",
    marginBottom: 20,
    alignItems: 'center',
  },

  expenseHeader:{
    padding: 15,
    borderRadius: 5,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  }
  
};

const Budget = () => {
  const { budget } = useContext(AppContext);
  const navigation= useNavigation('')
  return (
    <View style={styles.budgetContainer}>
      <Text style={styles.budgetText}>Budget: ${budget}</Text>
      <TouchableOpacity style={styles.editButton} onPress={() => navigation.navigate('EditBudget')}>
      <Text style={styles.buttonText}>Edit Budget</Text>
      </TouchableOpacity>
      
    </View>
  );
};

const Remains = () => {
  const { expenses, budget } = useContext(AppContext);

  const totalExpenses = expenses.reduce((total, item) => {
    return (total += item.cost);
  }, 0);

//change background colour to red if the expense is more than budget otherwise background colour will be green
  const alertColor = totalExpenses > budget ? '#e74c3c' : '#2ecc71';

  return (
    <View style={[styles.remainsContainer, { backgroundColor: alertColor }]}>
      <Text style={styles.remainsText}>Remains: ${budget - totalExpenses}</Text>
    </View>
  );
};

const ExpenseTotal = () => {
  const { expenses } = useContext(AppContext);

  const totalExpenses = expenses.reduce((total, item) => {
    return (total += item.cost);
  }, 0);

  return (
    <View style={styles.expenseTotalContainer}>
      <Text style={styles.expenseTotalText}>Total Expense: ${totalExpenses}</Text>
    </View>
  );
};


//create a list for expenses
const ExpenseList = () => {
  const { expenses } = useContext(AppContext);

  return (
    <FlatList
      data={expenses}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => <ExpenseItem id={item.id} category={item.category} cost={item.cost} />}
    />
  );
};

const ExpenseItem = (props) => {
  const { dispatch } = useContext(AppContext);

  const handleExpenseDelete = () => {
    dispatch({
      type: 'DELETE_EXPENSE',
      payload: props.id,
    });
  };

  return (
      <View style={styles.expenseItem}>
      <Text style={styles.expenseCategory}>{props.category}</Text>
      <Text style={styles.expenseCost}>${props.cost}</Text>
      <TouchableOpacity><TiDelete size='2em' onClick={handleExpenseDelete}/></TouchableOpacity>

      </View>
    
  );
};

export default function App() {
  return (
    <AppProvider>
      <NavigationContainer>
        {/* to display homescreen first */}
        <Stack.Navigator initialRouteName="Home">
          <Stack.Screen name="HomeScreen" component={HomeScreen} />
          <Stack.Screen name="AddTransaction" component={AddTransactionScreen} />
          <Stack.Screen name="Overview" component={OverviewScreen} />
          <Stack.Screen name="EditBudget" component={EditBudgetScreen} /> 
        </Stack.Navigator>
      </NavigationContainer>
    </AppProvider>
  );
}


