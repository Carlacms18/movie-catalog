import { createDrawerNavigator } from "@react-navigation/drawer";
import StackNavigator from "./StackNavigator";
import { NavigationContainer } from "@react-navigation/native";

const Drawer = createDrawerNavigator();

export default function DrawerNavigator() {
  return (
    <NavigationContainer>
      <Drawer.Navigator screenOptions={{ headerShown: false }}>
        <Drawer.Screen name="Movies" component={StackNavigator} />
      </Drawer.Navigator>
    </NavigationContainer>
  );
}
