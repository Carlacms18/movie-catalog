import { createStackNavigator } from "@react-navigation/stack";
import HomeScreen from "../screens/homeScreen";
import MovieDetailsScreen from "../screens/movieDetailsScreen";

const Stack = createStackNavigator();

export default function StackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="MovieDetails" component={MovieDetailsScreen} />
    </Stack.Navigator>
  );
}
