import React, { Component } from 'react';
import { Bar } from 'react-chartjs-2';

import { merge, Subject, of, defer, timer, combineLatest, race  } from 'rxjs';
import { takeUntil, tap, delay, switchMap, mapTo, repeat, debounceTime } from 'rxjs/operators';


function getRandomNumber() {
  return (~~(Math.random() * 200)).toString();
}

function getRandomDelay() {
  return Math.floor(Math.random() * (2000 - 100 + 1)) + 100;
}

function emitRandom(subj) {
  const default$ = of('N/A').pipe(delay(1000));
  const actual = of('').pipe(
                  switchMap(() => timer(getRandomDelay())
                    .pipe(mapTo(getRandomNumber()))
                  ),
                  repeat()
                )
  return merge(default$.pipe(takeUntil(actual)), actual)
  .pipe(
    debounceTime(100),
    tap(val => subj.next(val))
  );
}

const temperature$ = new Subject();
const pressure$ = new Subject();
const humidity$ = new Subject();

const temperature = defer(() => emitRandom(temperature$));
const pressure = defer(() => emitRandom(pressure$));
const humidity = defer(() => emitRandom(humidity$));

class ChartDemo extends Component {
  subs;
  state = {
    data: {
        labels: ['Temperature', 'Pressure', 'Humidity'],
        datasets: [
            {
                label: 'Monitor',
                backgroundColor: 'rgba(75,192,192,1)',
                borderColor: 'rgba(0,0,0,1)',
                borderWidth: 2,
                data: []
            }
        ]
    },
    temperature: '',
    pressure: '',
    humidity: '',
    started: false
  }

  start = () => {
    if (this.state.started) this.subs.unsubscribe();
    this.setState((state, _) => {
        if (!state.started) {
            this.subs && this.subs.unsubscribe();
            this.subs = combineLatest(temperature, pressure, humidity)
            .subscribe(data => {
                let datacopy = Object.assign({}, this.state.data)
                datacopy.datasets[0].data = data;
                const [temperature, pressure, humidity] = data;
                this.setState({data: datacopy, temperature, pressure, humidity})
            })
        }
        return {started: !state.started}
    });
  }

  render(){
    return(
      <div>
        {
            this.state.started && <div>
                <p>Temperature: {this.state.temperature}</p>
                <p>Pressure: {this.state.pressure}</p>
                <p>Humidity: {this.state.humidity}</p>
            </div>
            
        }
        <button onClick={this.start}>{this.state.started ? 'Stop' : 'Start'}</button>
        {/* <Bar
            data={this.state.data}
            width={100}
            height={50}
            redraw 
            options={{
                maintainAspectRatio: false,
                title:{
                    display:true,
                    text:'Live Analytics',
                    fontSize:20
                },
                legend:{
                    display:false,
                    position:'right'
                }
            }}
            /> */}
      </div>
    )
  }
}

export default ChartDemo;