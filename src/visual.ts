/*
 *  Power BI Visual CLI
 *
 *  Copyright (c) Microsoft Corporation
 *  All rights reserved.
 *  MIT License
 *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the ""Software""), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *
 *  The above copyright notice and this permission notice shall be included in
 *  all copies or substantial portions of the Software.
 *
 *  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 *  THE SOFTWARE.
 */

module powerbi.extensibility.visual {

    export class LineUpVisual implements IVisual {
        private readonly target: HTMLElement;
        //private readonly colorPalette: IColorPalette;

        private provider: any;
        private lineup: any;
        private settings = new LineUpVisualSettings();
        private lineupLib: any;

        constructor(options: VisualConstructorOptions) {
            this.lineupLib = (<any>window).LineUpJS;
            console.log('Visual constructor', options);
            //this._colorPalette = options.host.colorPalette;
            this.target = options.element;
            this.target.innerHTML = '<div></div>';
        }

        update(options: VisualUpdateOptions) {
            const oldSettings = this.settings;
            this.settings = LineUpVisual.parseSettings(options && options.dataViews && options.dataViews[0]);
            let providerChanged = false;
            const {rows, cols} = this.extract(options.dataViews[0].table!);

            if (!this.provider || !LineUpVisual.equalObject(oldSettings.provider, this.settings.provider)) {
                this.provider = new this.lineupLib.LocalDataProvider(rows, cols, this.settings.provider);
                this.provider.deriveDefault();
                providerChanged = true;
            } else if (LineUpVisual.dataChanged(rows, cols, this.provider.data, this.provider.getColumns())) {
                this.provider.clearColumns();
                cols.forEach((c: any) => this.provider.pushDesc(c));
                this.provider.setData(rows);
                this.provider.deriveDefault();
            }
            if (!this.lineup || !LineUpVisual.equalObject(oldSettings.lineup, this.settings.lineup)) {
                if (this.lineup) {
                    this.lineup.destroy();
                }
                this.lineup = new this.lineupLib.LineUp(this.target.firstElementChild!, this.provider, this.settings.lineup);
            } else if (providerChanged) {
                this.lineup.setDataProvider(this.provider);
            } else {
                this.lineup.update();
            }
        }

        private extract(_table: DataViewTable) {
            const rows: any[] = [];
            const cols: any[] = [];


            this.lineupLib.deriveColors(cols);
            return {rows, cols};
        }

        private static dataChanged(rows: any[], cols: any[], oldRows: any[], oldCols: any[]) {
            return rows === oldRows && cols === oldCols;
        }

        private static equalObject(a: any, b: any) {
            if (a === b) {
                return true;
            }
            if (!a || !b) {
                return false;
            }
            const aKeys = Object.keys(a);
            const bKeys = Object.keys(b);
            if (aKeys.length !== bKeys.length) {
                return false;
            }
            return aKeys.every((k) => a[k] === b[k]);
        }

        private static parseSettings(dataView: DataView): LineUpVisualSettings {
            return <LineUpVisualSettings>LineUpVisualSettings.parse(dataView);
        }

        destroy() {
            // TODO
        }


        /**
         * This function gets called for each of the objects defined in the capabilities files and allows you to select which of the
         * objects and properties you want to expose to the users in the property pane.
         *
         */
        enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstance[] | VisualObjectInstanceEnumerationObject {
            return LineUpVisualSettings.enumerateObjectInstances(this.settings || LineUpVisualSettings.getDefault(), options);
        }
    }
}