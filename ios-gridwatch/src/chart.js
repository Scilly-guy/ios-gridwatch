import { LineChart, FixedScaleAxis } from 'chartist';

new LineChart(
    '#myChart',{
        series:[{
            name: 'series-1',
            data: [
              { x: new Date(143134652600), y: 530 },
              { x: new Date(143234652600), y: 400 },
              { x: new Date(143340052600), y: 450 },
              { x: new Date(143366652600), y: 800 },
              { x: new Date(143410652600), y: 900 },
              { x: new Date(143508652600), y: 1320 },
              { x: new Date(143569652600), y: 180 },
              { x: new Date(143579652600), y: 110 }
            ]
          },
          {
            name: 'series-2',
            data: [
              { x: new Date(143134652600), y: 530 },
              { x: new Date(143234652600), y: 350 },
              { x: new Date(143334652600), y: 300 },
              { x: new Date(143384652600), y: 300 },
              { x: new Date(143568652600), y: 100 }
            ]
          }
        ]
      },
      {
        axisX: {
          type: FixedScaleAxis,
          divisor: 5,
          labelInterpolationFnc: value =>
            new Date(value).toLocaleString(undefined, {
              month: 'short',
              day: 'numeric'
            })
        }
      }
    );
    