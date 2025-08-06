import From from "./From"
import To from "./To"

function Main() {

    return (
        <div className="w-full flex-grow flex justify-center pt-32">

            <div className="card bg-base-300 w-1/3 h-1/2 shadow-sm p-4 flex gap-2">
                <From />
                <To />
                <button className="btn bg-base-100">Transfer</button>
            </div>

        </div>
    )
}

export default Main
