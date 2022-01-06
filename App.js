import React, { Component } from 'react';
import { StyleSheet, View, ScrollView,ActivityIndicator,Text,Dimensions } from 'react-native';
import { Table, TableWrapper, Row, Rows, Col, Cols, Cell } from 'react-native-table-component';
//import io from 'socket.io-client';

const ws = new WebSocket("wss://socket.delta.exchange"); 
//, { transports: ['websocket'], jsonp:false, forceNew: true, }
const win = Dimensions.get('window');
const ww = win.width/3;


export default class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: false,
      loadText: 'Loading data, Please wait...',
      tableHead: ['Symbol','Description', 'Underlying Asset', 'Mark Price'], //Row Header
      widthArr: [100, 100, 80, 80],
      productsArray:[], 
      message: 'No message from server.',
      connected: ws.connected,
      totalRows:'loading...'
    }
    this.updateRow = this.updateRow.bind(this);
    this.subscribeToDataExchangeChannel = this.subscribeToDataExchangeChannel.bind();
  }

  componentWillUnmount() {
    console.log('App.js>>>>>>componentWillUnmount>>>>>>start');
  }

  componentDidMount() {
    console.log('App.js>>>>>>componentDidMount>>>>>>');
    this.setState({loading: true},()=>{this.fetchFunction()});
    
    //WebSocket On Open handler
    ws.onopen = () => {
      console.log(">>>>>>>ws.opened");
      ws.send(JSON.stringify({"type": "ping"}));
    };

    //WebSocket On Message handler
    ws.onmessage = (e) => {
      // a message was received
      //console.log(">>>ws.onmessage"+JSON.stringify(e));
      this.setState({connected:true});
      if(e.data != null) {
        var formattedData = JSON.parse(e.data);
        if(formattedData.symbol) {
          console.log("formattedData.Symbol>>>"+formattedData.symbol+"::"+formattedData.mark_price);
          this.updateRow(formattedData.symbol, formattedData.mark_price);
        } 
      }
      
    };

    //WebSocket On Error handler
    ws.onerror = (e) => {
      // an error occurred
     console.log(">>>ws.onerror"+JSON.stringify(e));
     console.log("error:"+e.message);
    };

    //WebSocket On Close handler
    ws.onclose = (e) => {
      // connection closed
      console.log(">>>ws.onclose"+JSON.stringify(e));
      console.log(e.code, e.reason);
    };
    
  }

  //calling this method after data fetch to subscribe to the channel 
  subscribeToDataExchangeChannel(productSymbolsArray) {
    var symbolArray = productSymbolsArray.map(item => {
       return "\"" + item + "\""
    }).join(',');
    var payload = '{"type": "subscribe", "payload": {"channels": [{"name": "v2/ticker","symbols": [' 
                    + symbolArray 
                  + ']}]}}'; 
    ws.send(JSON.stringify(payload)); // send a message
  }

  //Updating marked price cell data  
  updateRow(symbolName, mark_price) {
    const index = this.state.productsArray.findIndex((item)=> item[0] === symbolName); 
    if(index > -1) {
      console.log(">>>>>>>>>updateRow>>>"+symbolName+ "::" + index);
      let newArray = [...this.state.productsArray];
      newArray[index][3] = mark_price;
      this.setState({productsArray: newArray});
    }

  }
  
  /*
  tempproductsArray.push(
    {id: item.id,
     symbol: item.symbol,
     description: item.description, 
     underlying_asset: item.underlying_asset.name, 
     markprice: item.strike_price});
  */

  //Fetch the data from server and set the table Data
  fetchFunction() {
    fetch('https://api.delta.exchange/v2/products',{
      method: 'GET',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        'Cache-Control': 'no-cache'
      },
    }).then((response) => response.json())
      .then((responseJson) => {
        var tempproductsArray = [];
        var tempproductSymbolsArray = [];
        var responseArray = responseJson.result.map(item => {
          tempproductsArray.push([item.symbol,item.description, item.underlying_asset.symbol,'']);
          tempproductSymbolsArray.push(item.symbol);
        });
        this.setState({
          loadText:'Generating table, PLease wait',  
        },()=>{
          this.setState({
            loading:false,
            productsArray:tempproductsArray,
            totalRows:tempproductsArray.length
          },()=>{
            this.subscribeToDataExchangeChannel(tempproductSymbolsArray);
          });  
        });
        
      })
      .catch((error) => {
        this.setState({loading: false});
      });
      
      
  }


  render() {
    const state = this.state;
    return (
      <View style={styles.container}>
        <Text>State: { this.state.connected ? 'Connected' : 'Disconnected' }</Text>
        <Text>Total Rows: { this.state.totalRows }</Text>

        {
          //Code for sticky column
          /* <ScrollView style={{height:'90%'}} horizontal={true}> 
          </ScrollView>
          <View style={{flexDirection:'row', height:'90%'}}>
            <Table borderStyle={{borderWidth: 1, borderColor: '#C1C0B9'}}>
                <Col data={state.columnArray}  style={[styles.header,{width:120}]} textStyle={styles.textHead}/>
            </Table>
            <ScrollView horizontal={true}>
              <Table borderStyle={{borderWidth: 1, borderColor: '#C1C0B9'}}>
                  <Row data={this.state.tableHead} style={styles.header} textStyle={styles.textHead} widthArr={state.widthArr}/>
                  <Rows data={state.productsArray} textStyle={styles.textRow} widthArr={state.widthArr}/>
              </Table>
            </ScrollView>
          </View>
        */}
          {
            this.state.loading ?
              <View style={styles.loader}>
                <ActivityIndicator size="large" color="purple" />
                <Text style={{color:'purple', fontWeight:'800'}}>{state.loadText}</Text>
              </View>
            :
              <ScrollView horizontal={true} style={{marginLeft:5, marginRight:5}}>
                <View>
                  <Table borderStyle={{borderWidth: 0.5, borderColor: '#C1C0B9'}}>
                    <Row data={state.tableHead} widthArr={state.widthArr} style={styles.header} textStyle={styles.textHead}/>
                  </Table>
                  <ScrollView style={styles.dataWrapper}>
                      <Table borderStyle={{borderWidth: 0.5, borderColor: 'white'}}>
                        {
                          this.state.productsArray.map((rowData, index) => (
                            <Row
                              key={index}
                              data={rowData}
                              widthArr={state.widthArr}
                              style={[styles.row, 0 && {backgroundColor: '#537791'}]}
                              textStyle={styles.textRow}
                            />
                          ))
                        }
                      </Table>
                    </ScrollView>
                </View>
              </ScrollView>
          }
          
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, paddingTop: 30, backgroundColor: '#fff',alignItems:'center',justifyContent:'center'},
  header: { height: 70, backgroundColor: '#537791' },
  textHead: { textAlign: 'center', color:'white' },
  textRow: { textAlign: 'center', color:'black' },
  dataWrapper: { marginTop: -1 },
  row: { height: 70, backgroundColor: '#E7E6E1' },
  loader: { flex: 1, justifyContent: "center",alignItems: "center",backgroundColor: "#fff"},
});