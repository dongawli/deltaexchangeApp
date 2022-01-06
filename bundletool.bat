copy bundletool.jar ".\android\app\release"
cd ".\android\app\release"
java -jar bundletool.jar build-apks --bundle=app-release.aab --output=app-release.apks --mode=universal
