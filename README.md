there is somethnig calledas expo auto slelton npm install react-native-auto-skeleton ,  ihave installed it, we can make our whole proejct with expo skelton firs tdo in search sectino so simply will remove the search skeotn compnoent we mae becuase this is very simpler, it is auto skeleton let me give you the readme of it, React Native Auto Skeleton – Lightweight Skeleton Loader for React Native
react-native-auto-skeleton is a modern skeleton loader for React Native, designed to automatically render loading placeholders (shimmer-style) based on your existing layout.

Ideal replacement for react-native-skeleton-placeholder and other manual solutions.

npm version npm downloads iOS Android TypeScript MIT License Bundle size
Demo
react-native-auto-skeleton demo

✅ Platform Support
Platform	Old Arch	Fabric
iOS	✅	✅
Android	✅	✅
Installation
Using npm:

npm install react-native-auto-skeleton
Using yarn:

yarn add react-native-auto-skeleton
Expo
This library works in Expo (with expo prebuild) without additional configuration.

Usage
⚠️ Warning: On Android, automatic detection of a view’s border-radius is not supported. You can override it manually via the defaultRadius prop.

Here's a quick example to get started:

import { AutoSkeletonView, AutoSkeletonIgnoreView } from 'react-native-auto-skeleton';
...

<AutoSkeletonView isLoading={isLoading}>
    ...YOUR VIEWS
  <AutoSkeletonIgnoreView> // Content that will be ignored by the skeleton
    ... Views without skeleton
  </AutoSkeletonIgnoreView>
</AutoSkeletonView>
Full example

import { AutoSkeletonView } from 'react-native-auto-skeleton';

interface IProfile {
  name: string;
  jobTitle: string;
  avatar: string;
}

const getProfile = async (): Promise<IProfile> => {
  // Fetch profile data from your API
};

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<IProfile>({} as IProfile);

  useEffect(() => {
    (async () => {
      const res = await getProfile();
      setProfile(res);
      setIsLoading(false);
    })();
  }, []);

  return (
     <AutoSkeletonView isLoading={isLoading}>
      <View style={styles.avatarWithName}>
        <Image style={styles.avatar} source={{ uri: profile.avatar }} />
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{profile.name}</Text>
          <Text style={styles.jobTitle}>{profile.jobTitle}</Text>
        </View>
      </View>

      {/* This buttons block will have skeleton applied */}
      <View style={styles.buttons}>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonTitle}>Add</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonTitle}>Delete</Text>
        </TouchableOpacity>
      </View>

      {/* Alternatively, to exclude buttons from skeleton rendering: */}
      <AutoSkeletonIgnoreView>
        <View style={styles.buttons}>
           ...
        </View>
      </AutoSkeletonIgnoreView>
    </AutoSkeletonView>
  );
}
API
AutoSkeletonView
Prop	type	Description
isLoading	boolean	Enables or disables the skeleton state
shimmerSpeed	number	Duration of one shimmer animation cycle in seconds. Lower values = faster shimmer
shimmerBackgroundColor	string	Background color for animation types: pulse and none
gradientColors	[string,string]	Gradient colors for the skeleton gradient
defaultRadius	number	Default corner radius for skeleton elements that don't have a defined borderRadius
animationType	"gradient" | "pulse" | "none"	Skeleton animation
AutoSkeletonIgnoreView
Wrap any subtree with this component to exclude it from skeleton rendering. Children will remain visible while the skeleton is active.

Best Practices
For rapid implementation, wrap entire UI sections with <AutoSkeletonView>.
For precise control, wrap individual UI components or groups separately.
Ensure components have clearly defined dimensions, backgrounds, or styles for optimal skeleton rendering.
To exclude specific components from skeleton rendering, wrap them with <AutoSkeletonIgnoreView>. Any content inside this wrapper will not be processed by the skeleton system.
🔁 Alternative Solutions
You may also know:

react-native-skeleton-placeholder
react-content-loader
If you're looking for a React Native skeleton loader that works automatically, with Fabric support, and no manual configuration, react-native-auto-skeleton is your go-to solution.